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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { session_id, user_agent } = await req.json()
    if (!session_id) throw new Error('session_id é obrigatório.')

    const ip_address = req.headers.get('x-forwarded-for') ?? 'IP não detectado'

    const { data: sessionData, error: upsertError } = await supabase
      .from('active_sessions')
      .upsert(
        {
          session_id,
          user_id: user.id,
          ip_address,
          user_agent,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      )
      .select('revoked_at')
      .single()

    if (upsertError) throw upsertError

    // Se a sessão foi revogada, informa o cliente
    if (sessionData?.revoked_at) {
      return new Response(JSON.stringify({ status: 'revoked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401, // Unauthorized
      })
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[create-or-update-session] Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})