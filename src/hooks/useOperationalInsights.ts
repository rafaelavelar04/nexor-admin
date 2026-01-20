import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Period } from '@/components/insights/PeriodFilter';

export const useOperationalInsights = (period: Period) => {
  return useQuery({
    queryKey: ['operationalInsights', period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { period },
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
};