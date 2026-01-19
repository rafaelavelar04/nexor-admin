import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@3.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ATENÇÃO: Adicione sua chave de API do Resend como um segredo no seu projeto Supabase.
// Vá para Project -> Edge Functions -> Manage Secrets e adicione um novo segredo chamado RESEND_API_KEY.
const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Campos "to", "subject", e "html" são obrigatórios.')
    }

    const { data, error } = await resend.emails.send({
      from: 'Nexor <onboarding@resend.dev>', // ATENÇÃO: Configure seu domínio no Resend para usar um remetente personalizado.
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[email-dispatcher] Erro ao enviar email:', error);
      throw error;
    }
    
    console.log(`[email-dispatcher] Email enviado com sucesso para ${to}. ID: ${data.id}`);

    return new Response(JSON.stringify({ message: 'Email enviado com sucesso', id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[email-dispatcher] Erro crítico:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})