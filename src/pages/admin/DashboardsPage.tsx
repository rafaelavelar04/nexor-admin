import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportsFilterBar } from '@/components/reports/ReportsFilterBar';
import FinancialDashboard from '@/components/dashboards/FinancialDashboard';
import OperationalDashboard from '@/components/dashboards/OperationalDashboard';
import CommercialDashboard from '@/components/dashboards/CommercialDashboard';

const DashboardsPage = () => {
  const { profile } = useSession();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardsData', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;
      const { data, error } = await supabase.rpc('get_dashboards_data', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  const canView = (dashboard: 'financial' | 'operational' | 'commercial') => {
    if (profile?.role === 'admin') return true;
    if (dashboard === 'financial' && profile?.role === 'financeiro') return true;
    if (dashboard === 'operational' && profile?.role === 'operacoes') return true;
    if (dashboard === 'commercial' && profile?.role === 'vendas') return true;
    return false;
  };

  const defaultTab = canView('financial') ? 'financial' : canView('operational') ? 'operational' : 'commercial';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboards</h1>
          <p className="text-muted-foreground mt-1">Análise estratégica para sua operação.</p>
        </div>
        <ReportsFilterBar dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          {canView('financial') && <TabsTrigger value="financial">Financeiro</TabsTrigger>}
          {canView('operational') && <TabsTrigger value="operational">Operacional</TabsTrigger>}
          {canView('commercial') && <TabsTrigger value="commercial">Comercial</TabsTrigger>}
        </TabsList>

        {isLoading && <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
        {isError && <div className="text-destructive">Erro ao carregar dados.</div>}
        
        {data && !isLoading && !isError && (
          <>
            {canView('financial') && <TabsContent value="financial"><FinancialDashboard data={data.financial} /></TabsContent>}
            {canView('operational') && <TabsContent value="operational"><OperationalDashboard data={data.operational} /></TabsContent>}
            {canView('commercial') && <TabsContent value="commercial"><CommercialDashboard data={data.commercial} /></TabsContent>}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default DashboardsPage;