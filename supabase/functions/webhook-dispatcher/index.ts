import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.150.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { event } = payload;

    if (!event) {
      throw new Error("O nome do evento está faltando no payload.");
    }
    
    console.log(`[webhook-dispatcher] Recebido evento: ${event}`);

    const { data: webhooks, error: webhooksError } = await supabaseAdmin
      .from('webhooks')
      .select('id, name, url, secret')
      .eq('active', true)
      .contains('events', [event]);

    if (webhooksError) throw webhooksError;

    if (!webhooks || webhooks.length === 0) {
      console.log(`[webhook-dispatcher] Nenhum webhook ativo encontrado para o evento: ${event}`);
      return new Response(JSON.stringify({ message: 'Nenhum webhook ativo para este evento.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    console.log(`[webhook-dispatcher] Encontrado(s) ${webhooks.length} webhook(s) para o evento: ${event}`);

    const dispatchPromises = webhooks.map(async (webhook) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'Nexor-Webhook-Dispatcher/1.0',
      };
      const body = JSON.stringify(payload);

      if (webhook.secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", encoder.encode(webhook.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const hexSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
        headers['X-Nexor-Signature'] = hexSignature;
      }

      let status_code: number | null = null;
      let success = false;
      let responseText: string | null = null;

      try {
        const response = await fetch(webhook.url, { method: 'POST', headers, body });
        status_code = response.status;
        success = response.ok;
        responseText = await response.text();
        console.log(`[webhook-dispatcher] Enviado para "${webhook.name}". Status: ${status_code}`);
      } catch (fetchError) {
        console.error(`[webhook-dispatcher] Erro ao enviar para "${webhook.name}":`, fetchError.message);
        responseText = fetchError.message;
        success = false;
      }

      const { error: logError } = await supabaseAdmin.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event,
        status_code,
        success,
        payload,
        response: responseText,
      });

      if (logError) {
        console.error(`[webhook-dispatcher] Falha ao inserir log para webhook ${webhook.id}:`, logError.message);
      }
    });

    await Promise.all(dispatchPromises);

    return new Response(JSON.stringify({ message: 'Webhooks despachados com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[webhook-dispatcher] Erro crítico:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});