import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportsFilterBar } from '@/components/reports/ReportsFilterBar';
import GeneralDashboardTab from '@/components/dashboards/GeneralDashboardTab';
import FinancialDashboard from '@/components/dashboards/FinancialDashboard';
import OperationalDashboard from '@/components/dashboards/OperationalDashboard';
import CommercialDashboard from '@/components/dashboards/CommercialDashboard';

const DashboardPage = () => {
  const { profile } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const isStrategicTabActive = ['financial', 'operational', 'commercial'].includes(activeTab);

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
    enabled: isStrategicTabActive && !!dateRange?.from && !!dateRange?.to,
  });

  const canView = (dashboard: 'financial' | 'operational' | 'commercial') => {
    if (!profile?.role) return false;
    if (profile.role === 'admin') return true;
    const permissions: Record<string, string[]> = {
      financeiro: ['financial'],
      operacoes: ['operational'],
      vendas: ['commercial'],
    };
    return permissions[profile.role]?.includes(dashboard) || false;
  };

  const renderStrategicTabContent = (type: 'financial' | 'operational' | 'commercial') => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive mt-6">Erro ao carregar dados. Tente atualizar o período.</div>;
    }
    if (data) {
      switch (type) {
        case 'financial':
          return <FinancialDashboard data={data.financial} />;
        case 'operational':
          return <OperationalDashboard data={data.operational} />;
        case 'commercial':
          return <CommercialDashboard data={data.commercial} />;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboards</h1>
          <p className="text-muted-foreground mt-1">Análise estratégica para sua operação.</p>
        </div>
        {isStrategicTabActive && <ReportsFilterBar dateRange={dateRange} setDateRange={setDateRange} />}
      </div>

      <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          {canView('financial') && <TabsTrigger value="financial">Financeiro</TabsTrigger>}
          {canView('operational') && <TabsTrigger value="operational">Operacional</TabsTrigger>}
          {canView('commercial') && <TabsTrigger value="commercial">Comercial</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <GeneralDashboardTab />
        </TabsContent>
        
        {canView('financial') && (
          <TabsContent value="financial">
            {renderStrategicTabContent('financial')}
          </TabsContent>
        )}
        {canView('operational') && (
          <TabsContent value="operational">
            {renderStrategicTabContent('operational')}
          </TabsContent>
        )}
        {canView('commercial') && (
          <TabsContent value="commercial">
            {renderStrategicTabContent('commercial')}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DashboardPage;