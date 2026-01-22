import GeneralDashboardTab from '@/components/dashboards/GeneralDashboardTab';

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua operação.</p>
      </div>
      <GeneralDashboardTab />
    </div>
  );
};

export default DashboardPage;