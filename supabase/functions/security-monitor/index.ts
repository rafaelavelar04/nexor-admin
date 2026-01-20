import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { subHours } from 'https://deno.land/x/date_fns@v2.22.1/index.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to avoid creating duplicate alerts
async function createAlertIfNotExists(supabaseAdmin: SupabaseClient, rule_id: string, user_id: string, title: string, description: string, link: string) {
  const { data: existingAlert, error: checkError } = await supabaseAdmin
    .from('alerts')
    .select('id')
    .eq('rule_id', rule_id)
    .eq('description', description) // Check description to make it more specific
    .eq('archived', false)
    .gte('created_at', subHours(new Date(), 24).toISOString()) // Don't create if a similar one exists in the last 24h
    .maybeSingle();

  if (checkError) {
    console.error(`[security-monitor] Error checking for existing alert for rule ${rule_id}:`, checkError.message);
    return;
  }

  if (!existingAlert) {
    const { error: insertError } = await supabaseAdmin.from('alerts').insert({
      user_id, // The admin user to be notified
      rule_id,
      title,
      description,
      link,
    });
    if (insertError) {
      console.error(`[security-monitor] Error creating alert for rule ${rule_id}:`, insertError.message);
    } else {
      console.log(`[security-monitor] Created alert: ${title}`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[security-monitor] Starting security check...');

    const { data: rules, error: rulesError } = await supabaseAdmin.from('alert_rules').select('*').eq('enabled', true).eq('module', 'Segurança');
    if (rulesError) throw rulesError;
    const rulesMap = new Map(rules.map(r => [r.id, r]));

    const { data: admins, error: adminsError } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
    if (adminsError) throw adminsError;
    const adminIds = admins.map(a => a.id);

    const lookbackDate = subHours(new Date(), 24).toISOString();
    const { data: recentSessions, error: sessionsError } = await supabaseAdmin
      .from('active_sessions')
      .select('user_id, ip_address, user_agent, last_seen_at, user:profiles(full_name)')
      .gte('last_seen_at', lookbackDate)
      .is('revoked_at', null);
    if (sessionsError) throw sessionsError;

    const sessionsByUser = (recentSessions || []).reduce((acc, session) => {
      if (!acc[session.user_id]) {
        acc[session.user_id] = [];
      }
      acc[session.user_id].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    for (const userId in sessionsByUser) {
      const userSessions = sessionsByUser[userId];
      const userName = userSessions[0]?.user?.full_name || userId;

      const { data: historicalData } = await supabaseAdmin
        .from('active_sessions')
        .select('ip_address, user_agent')
        .eq('user_id', userId)
        .lt('last_seen_at', lookbackDate);
      
      const historicalIPs = new Set((historicalData || []).map(s => s.ip_address));
      const historicalAgents = new Set((historicalData || []).map(s => s.user_agent));

      const recentIPs = new Set(userSessions.map(s => s.ip_address));
      const recentAgents = new Set(userSessions.map(s => s.user_agent));

      if (rulesMap.has('security-new-ip')) {
        for (const ip of recentIPs) {
          if (!historicalIPs.has(ip)) {
            for (const adminId of adminIds) {
              await createAlertIfNotExists(supabaseAdmin, 'security-new-ip', adminId, `Novo IP para ${userName}`, `O usuário ${userName} acessou de um novo IP: ${ip}.`, `/admin/settings?tab=sessions`);
            }
          }
        }
      }

      if (rulesMap.has('security-new-device')) {
        for (const agent of recentAgents) {
          if (!historicalAgents.has(agent)) {
            for (const adminId of adminIds) {
              await createAlertIfNotExists(supabaseAdmin, 'security-new-device', adminId, `Novo dispositivo para ${userName}`, `O usuário ${userName} acessou de um novo dispositivo.`, `/admin/settings?tab=sessions`);
            }
          }
        }
      }
      
      if (rulesMap.has('security-rapid-ip-change') && recentIPs.size > rulesMap.get('security-rapid-ip-change').threshold) {
        for (const adminId of adminIds) {
          await createAlertIfNotExists(supabaseAdmin, 'security-rapid-ip-change', adminId, `Múltiplos IPs para ${userName}`, `O usuário ${userName} acessou de ${recentIPs.size} IPs diferentes nas últimas 24h.`, `/admin/settings?tab=sessions`);
        }
      }

      if (rulesMap.has('security-off-hours')) {
        const rule = rulesMap.get('security-off-hours');
        const startHour = rule.threshold || 8;
        const endHour = 20;
        for (const session of userSessions) {
          const sessionHour = new Date(session.last_seen_at).getUTCHours() - 3; // Adjust for Brazil time (UTC-3)
          if (sessionHour < startHour || sessionHour >= endHour) {
            for (const adminId of adminIds) {
              await createAlertIfNotExists(supabaseAdmin, 'security-off-hours', adminId, `Acesso fora de hora por ${userName}`, `O usuário ${userName} acessou o sistema às ${new Date(session.last_seen_at).toLocaleTimeString('pt-BR')}.`, `/admin/settings?tab=sessions`);
            }
            break;
          }
        }
      }
    }

    console.log('[security-monitor] Security check completed.');
    return new Response(JSON.stringify({ message: 'Security check completed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[security-monitor] Critical error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});