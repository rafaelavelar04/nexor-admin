import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createAlertIfNotExists } from '../_shared/utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface Issue {
  title: string;
  description: string;
  link: string;
  responsible_id: string | null;
}

// Funções de processamento de regras
async function processRule(client: SupabaseClient, rule: any): Promise<Issue[]> {
  let rpcName = '';
  let rpcParams: any = {};
  let mapper: (item: any) => Issue;

  switch (rule.id) {
    case 'lead-uncontacted':
      rpcName = 'query_uncontacted_leads';
      rpcParams = { days_old: rule.threshold };
      mapper = (item: any) => ({
        title: `Lead "${item.nome}" não contatado`,
        description: `O lead "${item.nome}" foi criado há mais de ${rule.threshold} dias e ainda não foi contatado.`,
        link: `/admin/leads/${item.id}`,
        responsible_id: item.responsavel_id,
      });
      break;
    case 'lead-followup-overdue':
      rpcName = 'query_followup_overdue_leads';
      rpcParams = { days_overdue: rule.threshold };
      mapper = (item: any) => ({
        title: `Follow-up de "${item.nome}" atrasado`,
        description: `O follow-up agendado para ${new Date(item.proximo_followup).toLocaleDateString('pt-BR')} está atrasado.`,
        link: `/admin/leads/${item.id}`,
        responsible_id: item.responsavel_id,
      });
      break;
    case 'opp-stagnant-stage':
      rpcName = 'query_stagnant_opportunities';
      rpcParams = { days_stagnant: rule.threshold };
      mapper = (item: any) => ({
        title: `Oportunidade "${item.titulo}" estagnada`,
        description: `A oportunidade "${item.titulo}" não é atualizada há mais de ${rule.threshold} dias.`,
        link: `/admin/opportunities/${item.id}`,
        responsible_id: item.responsavel_id,
      });
      break;
    case 'ticket-stale':
    case 'ticket-urgent-stale':
        rpcName = 'query_stale_tickets';
        rpcParams = { hours_stale: rule.threshold };
        mapper = (item: any) => ({
            title: `Ticket "${item.title}" parado`,
            description: `O ticket não recebe uma atualização há mais de ${rule.threshold} horas.`,
            link: `/admin/suporte/${item.id}`,
            responsible_id: item.owner_id,
        });
        break;
    case 'receivable-overdue':
        rpcName = 'query_overdue_receivables';
        rpcParams = {};
        mapper = (item: any) => ({
            title: `Recebível de ${item.company_name} atrasado`,
            description: `A parcela de ${formatCurrency(item.amount)} venceu em ${new Date(item.due_date).toLocaleDateString('pt-BR')}.`,
            link: `/admin/financeiro/${item.contract_id}`,
            responsible_id: item.responsavel_id,
        });
        break;
    case 'cost-unpaid':
        rpcName = 'query_unpaid_costs';
        rpcParams = { days_stale: rule.threshold };
        mapper = (item: any) => ({
            title: `Custo previsto para ${item.partner_name} antigo`,
            description: `O custo de ${formatCurrency(item.valor)} está como "previsto" há mais de ${rule.threshold} dias.`,
            link: `/admin/financeiro/${item.contract_id}`,
            responsible_id: item.responsavel_id,
        });
        break;
    case 'goal-at-risk':
        rpcName = 'query_at_risk_goals';
        rpcParams = { performance_threshold: rule.threshold };
        mapper = (item: any) => ({
            title: `Meta de ${item.full_name || 'Global'} em risco`,
            description: `Atingimento de ${formatCurrency(item.achieved_value)} de ${formatCurrency(item.valor)} (${((item.achieved_value / item.valor) * 100).toFixed(1)}%).`,
            link: `/admin/metas`,
            responsible_id: item.responsavel_id,
        });
        break;
    default:
      return [];
  }

  const { data, error } = await client.rpc(rpcName, rpcParams);
  if (error) {
    console.error(`[alert-generator] Erro na regra ${rule.id} (RPC: ${rpcName}):`, error.message);
    return [];
  }
  return data.map(mapper);
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

    const { data: admins, error: adminsError } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
    if (adminsError) throw adminsError;
    const adminIds = admins.map(a => a.id);

    for (const rule of rules) {
      if (rule.module === 'Segurança') continue; // Ignora regras de segurança, tratadas em outra função

      const foundIssues = await processRule(supabaseAdmin, rule);

      for (const issue of foundIssues) {
        const targetUserIds = new Set<string>();
        if ((rule.visibility === 'responsible' || rule.visibility === 'both') && issue.responsible_id) {
          targetUserIds.add(issue.responsible_id);
        }
        if (rule.visibility === 'admin' || rule.visibility === 'both') {
          adminIds.forEach(id => targetUserIds.add(id));
        }

        for (const userId of targetUserIds) {
          await createAlertIfNotExists(supabaseAdmin, rule.id, userId, issue.title, issue.description, issue.link);
        }
      }
    }

    console.log('[alert-generator] Verificação de alertas concluída.');
    return new Response(JSON.stringify({ message: 'Verificação concluída.' }), {
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