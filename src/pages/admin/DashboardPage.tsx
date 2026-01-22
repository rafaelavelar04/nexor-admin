import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
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

  const canView = (dashboard: 'financial' | 'operational' | 'commercial') => {
    if (!profile?.role) return false;
    if (profile.role === 'admin') return true;
    const permissions: Record<string, string[]> = {
      operacoes: ['operational', 'financial'],
      vendas: ['commercial'],
    };
    return permissions[profile.role]?.includes(dashboard) || false;
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
            <FinancialDashboard dateRange={dateRange} />
          </TabsContent>
        )}
        {canView('operational') && (
          <TabsContent value="operational">
            <OperationalDashboard dateRange={dateRange} />
          </TabsContent>
        )}
        {canView('commercial') && (
          <TabsContent value="commercial">
            <CommercialDashboard dateRange={dateRange} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DashboardPage;