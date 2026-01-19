import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Autenticar o admin que está fazendo a requisição
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) throw new Error('Acesso negado.')

    // 2. Verificar se o usuário é admin usando a função RPC
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError || !isAdmin) {
      console.error(`[revoke-session] Falha na verificação de admin para o usuário ${adminUser.id}:`, rpcError?.message);
      throw new Error('Apenas administradores podem revogar sessões.');
    }

    // 3. Obter os dados da requisição
    const { target_session_id, reason } = await req.json()
    if (!target_session_id) throw new Error('target_session_id é obrigatório.')

    // 4. Usar o cliente com service_role para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Encontrar a sessão e o usuário alvo
    const { data: sessionToRevoke, error: findError } = await supabaseAdmin
      .from('active_sessions')
      .select('id, user_id')
      .eq('session_id', target_session_id)
      .single()
    if (findError || !sessionToRevoke) {
      throw new Error('Sessão não encontrada.')
    }

    // 6. Marcar a sessão como revogada no nosso registro
    const { error: updateError } = await supabaseAdmin
      .from('active_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: adminUser.id,
        revoke_reason: reason,
      })
      .eq('id', sessionToRevoke.id)

    if (updateError) throw updateError

    // 7. Efetivamente revogar TODAS as sessões do usuário alvo no Supabase Auth
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(sessionToRevoke.user_id)
    if (signOutError) {
      // Tenta reverter a marcação se o signOut falhar
      await supabaseAdmin.from('active_sessions').update({ revoked_at: null, revoked_by: null, revoke_reason: null }).eq('id', sessionToRevoke.id)
      throw signOutError
    }
    
    console.log(`[revoke-session] Admin ${adminUser.id} revogou a sessão ${target_session_id} do usuário ${sessionToRevoke.user_id}`);

    return new Response(JSON.stringify({ message: 'Sessão revogada com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[revoke-session] Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})