import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { differenceInDays, parseISO, startOfDay, subDays } from 'https://esm.sh/date-fns@2.30.0'

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

    const { period } = await req.json()
    const days = parseInt(String(period).replace('d', ''), 10) || 30;
    const startDate = subDays(startOfDay(new Date()), days - 1).toISOString();

    console.log(`[generate-insights] Analisando dados dos últimos ${days} dias.`);

    // Buscar dados relevantes
    const { data: opportunities, error: oppsError } = await supabase
      .from('opportunities')
      .select('created_at, closed_at, status, valor_estimado, responsavel_id, lead:leads(nicho), responsavel:profiles(full_name)')
      .gte('created_at', startDate);
    if (oppsError) throw oppsError;

    // 1. Insight: Nicho com maior taxa de conversão
    const nicheStats = opportunities.reduce((acc, opp) => {
      const niche = opp.lead?.nicho || 'Não especificado';
      if (!acc[niche]) acc[niche] = { total: 0, won: 0 };
      acc[niche].total++;
      if (opp.status === 'won') acc[niche].won++;
      return acc;
    }, {} as Record<string, { total: number; won: number }>);

    let bestNiche = { name: 'N/A', rate: 0 };
    for (const niche in nicheStats) {
      if (nicheStats[niche].total > 2) { // Mínimo de 3 oportunidades para ser estatisticamente relevante
        const rate = (nicheStats[niche].won / nicheStats[niche].total) * 100;
        if (rate > bestNiche.rate) {
          bestNiche = { name: niche, rate };
        }
      }
    }

    // 2. Insight: Ciclo de Venda Médio
    const wonOpps = opportunities.filter(o => o.status === 'won' && o.closed_at);
    const totalDays = wonOpps.reduce((sum, o) => {
      return sum + differenceInDays(parseISO(o.closed_at!), parseISO(o.created_at));
    }, 0);
    const salesCycle = wonOpps.length > 0 ? Math.round(totalDays / wonOpps.length) : 0;

    // 3. Insight: Vendedor Destaque
    const repStats = wonOpps.reduce((acc, opp) => {
      const repName = opp.responsavel?.full_name || 'Não atribuído';
      if (!acc[repName]) acc[repName] = 0;
      acc[repName] += opp.valor_estimado || 0;
      return acc;
    }, {} as Record<string, number>);
    
    let topRep = { name: 'N/A', value: 0 };
    for (const rep in repStats) {
      if (repStats[rep] > topRep.value) {
        topRep = { name: rep, value: repStats[rep] };
      }
    }

    const insights = {
      bestNiche: bestNiche.name !== 'N/A' ? bestNiche : null,
      salesCycle: salesCycle > 0 ? { days: salesCycle } : null,
      topRep: topRep.name !== 'N/A' ? topRep : null,
    };

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[generate-insights] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});