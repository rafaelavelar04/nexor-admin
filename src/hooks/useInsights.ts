import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Period } from '@/components/insights/PeriodFilter';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const getDateRanges = (period: Period) => {
  const now = new Date();
  let currentStart, currentEnd, previousStart, previousEnd;

  switch (period) {
    case '7d':
      currentEnd = endOfDay(now);
      currentStart = startOfDay(subDays(now, 6));
      previousEnd = endOfDay(subDays(now, 7));
      previousStart = startOfDay(subDays(now, 13));
      break;
    case '30d':
      currentEnd = endOfDay(now);
      currentStart = startOfDay(subDays(now, 29));
      previousEnd = endOfDay(subDays(now, 30));
      previousStart = startOfDay(subDays(now, 59));
      break;
    case '90d':
      currentEnd = endOfDay(now);
      currentStart = startOfDay(subDays(now, 89));
      previousEnd = endOfDay(subDays(now, 90));
      previousStart = startOfDay(subDays(now, 179));
      break;
    case 'this_month':
      currentStart = startOfMonth(now);
      currentEnd = endOfDay(now);
      const lastMonth = subMonths(now, 1);
      previousStart = startOfMonth(lastMonth);
      previousEnd = endOfMonth(lastMonth);
      break;
    case 'last_month':
      const prevMonth = subMonths(now, 1);
      currentStart = startOfMonth(prevMonth);
      currentEnd = endOfMonth(prevMonth);
      const twoMonthsAgo = subMonths(now, 2);
      previousStart = startOfMonth(twoMonthsAgo);
      previousEnd = endOfMonth(twoMonthsAgo);
      break;
  }
  return { currentStart, currentEnd, previousStart, previousEnd };
};

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const useInsights = (period: Period) => {
  return useQuery({
    queryKey: ['insights', period],
    queryFn: async () => {
      const { currentStart, currentEnd, previousStart } = getDateRanges(period);

      const { data: leads, error: leadsError } = await supabase.from('leads').select('created_at, status')
        .gte('created_at', previousStart.toISOString()).lte('created_at', currentEnd.toISOString());
      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase.from('opportunities').select('created_at, closed_at, status, valor_estimado, pipeline_stage:pipeline_stages(nome)')
        .gte('created_at', previousStart.toISOString()).lte('created_at', currentEnd.toISOString());
      if (oppsError) throw oppsError;

      // Processamento
      const inCurrentRange = (date: string) => new Date(date) >= currentStart && new Date(date) <= currentEnd;
      const inPreviousRange = (date: string) => new Date(date) >= previousStart && new Date(date) < currentStart;

      // Leads
      const currentLeads = leads.filter(l => inCurrentRange(l.created_at));
      const previousLeads = leads.filter(l => inPreviousRange(l.created_at));
      const leadsVolume = {
        current: currentLeads.length,
        change: calculateChange(currentLeads.length, previousLeads.length),
      };

      // Oportunidades
      const currentWon = opportunities.filter(o => o.status === 'won' && o.closed_at && inCurrentRange(o.closed_at));
      const currentLost = opportunities.filter(o => o.status === 'lost' && o.closed_at && inCurrentRange(o.closed_at));
      const previousWon = opportunities.filter(o => o.status === 'won' && o.closed_at && inPreviousRange(o.closed_at));
      const previousLost = opportunities.filter(o => o.status === 'lost' && o.closed_at && inPreviousRange(o.closed_at));

      const currentWinRate = (currentWon.length + currentLost.length) > 0 ? (currentWon.length / (currentWon.length + currentLost.length)) * 100 : 0;
      const previousWinRate = (previousWon.length + previousLost.length) > 0 ? (previousWon.length / (previousWon.length + previousLost.length)) * 100 : 0;
      
      const winRate = {
        current: currentWinRate,
        change: currentWinRate - previousWinRate, // Direct percentage point difference
      };

      const openOpps = opportunities.filter(o => o.status === 'open');
      const pipelineValue = openOpps.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
      const oppsByStage = openOpps.reduce((acc, opp) => {
        const stageName = opp.pipeline_stage?.nome || 'Sem Etapa';
        acc[stageName] = (acc[stageName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const oppsChartData = Object.keys(oppsByStage).map(name => ({ name, value: oppsByStage[name] }));


      return {
        leads: {
          volume: leadsVolume,
        },
        opportunities: {
          winRate,
          pipelineValue,
          oppsChartData,
        }
      };
    },
  });
};