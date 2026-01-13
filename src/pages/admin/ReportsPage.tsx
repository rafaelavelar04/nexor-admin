import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportsFilterBar } from '@/components/reports/ReportsFilterBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsReportTab } from '@/pages/admin/reports/LeadsReportTab';
import { OpportunitiesReportTab } from '@/pages/admin/reports/OpportunitiesReportTab';
import { PipelineReportTab } from '@/pages/admin/reports/PipelineReportTab';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), // 30 days total including today
    to: new Date(),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reportsData', dateRange],
    queryFn: async () => {
      const from = dateRange?.from;
      const to = dateRange?.to;

      if (!from || !to) {
        return null;
      }

      const { data, error } = await supabase.rpc('get_reports_data', {
        start_date: format(from, 'yyyy-MM-dd'),
        end_date: format(to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Analise o desempenho do seu processo comercial.</p>
        </div>
        <ReportsFilterBar dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>
        
        {isLoading && (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        {isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Relatórios</AlertTitle>
            <AlertDescription>
              Não foi possível buscar os dados. Por favor, tente novamente mais tarde.
              <br />
              <small>{error.message}</small>
            </AlertDescription>
          </Alert>
        )}
        
        {data && !isLoading && !isError && (
          <>
            <TabsContent value="leads">
              <LeadsReportTab data={data.leads} />
            </TabsContent>
            <TabsContent value="opportunities">
              <OpportunitiesReportTab data={data.opportunities} />
            </TabsContent>
            <TabsContent value="pipeline">
              <PipelineReportTab data={data.pipeline} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ReportsPage;