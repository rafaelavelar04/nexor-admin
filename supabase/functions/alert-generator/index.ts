import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Issue {
  title: string;
  description: string;
  link: string;
  responsible_id: string | null;
}

// Funções de verificação de regras (sem alterações)
async function processLeadUncontacted(client: SupabaseClient, rule: any): Promise<Issue[]> {
  const threshold = rule.threshold || 2;
  const { data, error } = await client.rpc('query_uncontacted_leads', { days_old: threshold });
  if (error) {
    console.error(`[alert-generator] Erro na regra ${rule.id}:`, error.message);
    return [];
  }
  return data.map((lead: any) => ({
    title: `Lead "${lead.nome}" não contatado`,
    description: `O lead "${lead.nome}" foi criado há mais de ${threshold} dias e ainda não foi contatado.`,
    link: `/admin/leads/${lead.id}`,
    responsible_id: lead.responsavel_id,
  }));
}

async function processOppStagnant(client: SupabaseClient, rule: any): Promise<Issue[]> {
  const threshold = rule.threshold || 7;
  const { data, error } = await client.rpc('query_stagnant_opportunities', { days_stagnant: threshold });
  if (error) {
    console.error(`[alert-generator] Erro na regra ${rule.id}:`, error.message);
    return [];
  }
  return data.map((opp: any) => ({
    title: `Oportunidade "${opp.titulo}" estagnada`,
    description: `A oportunidade "${opp.titulo}" não é atualizada há mais de ${threshold} dias.`,
    link: `/admin/opportunities/${opp.id}`,
    responsible_id: opp.responsavel_id,
  }));
}

// Função para formatar o corpo do email
function formatEmailBody(title: string, description: string, link: string): string {
  const projectUrl = Deno.env.get('SUPABASE_URL')?.split('.co')[0] + '.co';
  const fullLink = `${projectUrl}${link}`;
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #007bff;">Novo Alerta no Nexor</h2>
      <h3 style="font-size: 1.1em;">${title}</h3>
      <p>${description}</p>
      <a href="${fullLink}" style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">
        Ver no Sistema
      </a>
      <p style="font-size: 0.8em; color: #888; margin-top: 20px;">Esta é uma notificação automática. Por favor, não responda a este email.</p>
    </div>
  `;
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

    console.log('[alert-generator] Iniciando a verificação de alertas.');

    const { data: rules, error: rulesError } = await supabaseAdmin.from('alert_rules').select('*').eq('enabled', true);
    if (rulesError) throw rulesError;

    const { data: users, error: usersError } = await supabaseAdmin.from('profiles').select('id, role, user_email:users(email)');
    if (usersError) throw usersError;
    
    const userMap = new Map(users.map((u: any) => [u.id, { role: u.role, email: u.user_email?.email }]));
    const admins = users.filter((u: any) => u.role === 'admin');

    let alertsToCreate: any[] = [];
    let emailsToSend: any[] = [];

    for (const rule of rules) {
      let foundIssues: Issue[] = [];
      switch (rule.id) {
        case 'lead-uncontacted':
          foundIssues = await processLeadUncontacted(supabaseAdmin, rule);
          break;
        case 'opp-stagnant-stage':
          foundIssues = await processOppStagnant(supabaseAdmin, rule);
          break;
      }

      if (foundIssues.length > 0) {
        const links = foundIssues.map(issue => issue.link);
        const { data: existingAlerts } = await supabaseAdmin.from('alerts').select('link').eq('rule_id', rule.id).eq('archived', false).in('link', links);
        const existingLinks = new Set((existingAlerts || []).map((a: any) => a.link));
        const newIssues = foundIssues.filter(issue => !existingLinks.has(issue.link));

        for (const issue of newIssues) {
          const targetUserIds = new Set<string>();
          if (rule.visibility === 'responsible' || rule.visibility === 'both') {
            if (issue.responsible_id) targetUserIds.add(issue.responsible_id);
          }
          if (rule.visibility === 'admin' || rule.visibility === 'both') {
            admins.forEach((admin: any) => targetUserIds.add(admin.id));
          }

          for (const userId of targetUserIds) {
            alertsToCreate.push({ user_id: userId, rule_id: rule.id, title: issue.title, description: issue.description, link: issue.link });
            
            const user = userMap.get(userId);
            if (user && user.email) {
              emailsToSend.push({
                to: user.email,
                subject: `Alerta Nexor: ${issue.title}`,
                html: formatEmailBody(issue.title, issue.description, issue.link),
              });
            }
          }
        }
      }
    }

    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('alerts').insert(alertsToCreate);
      if (insertError) throw insertError;
      console.log(`[alert-generator] Criados ${alertsToCreate.length} novos alertas.`);
    } else {
      console.log(`[alert-generator] Nenhum novo alerta para criar.`);
    }

    if (emailsToSend.length > 0) {
      const emailPromises = emailsToSend.map(email => 
        supabaseAdmin.functions.invoke('email-dispatcher', { body: email })
      );
      await Promise.all(emailPromises);
      console.log(`[alert-generator] ${emailsToSend.length} emails despachados.`);
    }

    return new Response(JSON.stringify({ message: 'Verificação concluída.', created: alertsToCreate.length, emails: emailsToSend.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[alert-generator] Erro crítico:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});