import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MonthlyGoalCard } from '@/components/dashboard/MonthlyGoalCard';
import { Loader2, Users, Briefcase, Target, BarChart, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell, Line, LineChart, Area, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';
import { subDays, startOfMonth, isWithinInterval, format, endOfMonth } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { formatCurrency } from '@/lib/formatters';
import { useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ChartConfig, ChartConfigurator } from '@/components/dashboard/ChartConfigurator';
import { Card, CardContent } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color || pld.fill }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useSession();

  const [leadsChartConfig, setLeadsChartConfig] = useLocalStorage<ChartConfig>('dashboard-leads-chart-config', { type: 'bar' });
  const [oppsChartConfig, setOppsChartConfig] = useLocalStorage<ChartConfig>('dashboard-opps-chart-config', { type: 'pie' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const { data: leads, error: leadsError } = await supabase.from('leads').select('created_at');
      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase.from('opportunities').select('status, valor_estimado, closed_at, responsavel_id, pipeline_stage:pipeline_stages(nome)');
      if (oppsError) throw oppsError;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('mes', currentMonth)
        .eq('ano', currentYear);
      if (goalsError) throw goalsError;

      const { data: receivables, error: receivablesError } = await supabase
        .from('contract_receivables')
        .select('amount, due_date, status, paid_at');
      if (receivablesError) throw receivablesError;

      return { leads, opportunities, goals, receivables };
    }
  });

  const processedData = useMemo(() => {
    if (!data) return null;
    const { leads, opportunities } = data;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const recentLeads = leads.filter(l => new Date(l.created_at) > thirtyDaysAgo);
    const leadsByDay = recentLeads.reduce((acc, lead) => {
      const day = format(new Date(lead.created_at), 'dd/MM');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const leadsChartData = Object.keys(leadsByDay).map(day => ({ date: day, Leads: leadsByDay[day] }));

    const openOpps = opportunities.filter(o => o.status === 'open');
    const oppsByStage = openOpps.reduce((acc, opp) => {
      const stageName = opp.pipeline_stage?.nome || 'Sem Etapa';
      acc[stageName] = (acc[stageName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const oppsChartData = Object.keys(oppsByStage).map(name => ({ name, value: oppsByStage[name] }));

    return { leadsChartData, oppsChartData };
  }, [data]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError || !data) {
    return <div className="text-destructive">Erro ao carregar os dados do dashboard.</div>;
  }

  const { opportunities, goals, receivables } = data;
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);
  
  const wonThisMonth = opportunities.filter(o => o.status === 'won' && o.closed_at && isWithinInterval(new Date(o.closed_at), { start: startOfCurrentMonth, end: now }));
  const wonThisMonthValue = wonThisMonth.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const totalLeads = data.leads.length;
  const openOpportunities = opportunities.filter(o => o.status === 'open').length;
  const pipelineValue = opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const receivablesThisMonth = receivables.filter(r => r.due_date && isWithinInterval(new Date(r.due_date), { start: startOfCurrentMonth, end: endOfCurrentMonth }));
  const forecastedRevenueThisMonth = receivablesThisMonth.reduce((sum, r) => sum + r.amount, 0);
  const receivedRevenueThisMonth = receivablesThisMonth
    .filter(r => r.status === 'pago' && r.paid_at && isWithinInterval(new Date(r.paid_at), { start: startOfCurrentMonth, end: endOfCurrentMonth }))
    .reduce((sum, r) => sum + r.amount, 0);

  const globalGoal = goals.find(g => g.responsavel_id === null);
  const userGoal = user ? goals.find(g => g.responsavel_id === user.id) : null;
  
  const userWonThisMonthValue = wonThisMonth
    .filter(o => o.responsavel_id === user?.id)
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const renderLeadsChart = () => {
    if (!processedData?.leadsChartData || processedData.leadsChartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de leads para exibir.</div>;
    }
    switch (leadsChartConfig.type) {
      case 'line':
        return <LineChart data={processedData.leadsChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="Leads" stroke="hsl(var(--primary))" /></LineChart>;
      case 'area':
        return <AreaChart data={processedData.leadsChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} /></AreaChart>;
      case 'bar':
      default:
        return <RechartsBarChart data={processedData.leadsChartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></RechartsBarChart>;
    }
  };

  const renderOppsChart = () => {
    if (!processedData?.oppsChartData || processedData.oppsChartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem oportunidades abertas.</div>;
    }
    switch (oppsChartConfig.type) {
      case 'donut':
        return <PieChart><Tooltip content={<CustomTooltip />} /><Pie data={processedData.oppsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>{processedData.oppsChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Legend /></PieChart>;
      case 'pie':
      default:
        return <PieChart><Tooltip content={<CustomTooltip />} /><Pie data={processedData.oppsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{processedData.oppsChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Legend /></PieChart>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do desempenho comercial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Leads Ativos" value={totalLeads} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Oportunidades Abertas" value={openOpportunities} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Valor do Pipeline" value={formatCurrency(pipelineValue)} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Ganhos no Mês (Opps)" value={formatCurrency(wonThisMonthValue)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Receita Prevista (Mês)" value={formatCurrency(forecastedRevenueThisMonth)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Receita Recebida (Mês)" value={formatCurrency(receivedRevenueThisMonth)} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userGoal && <MonthlyGoalCard title="Minha Meta do Mês" target={userGoal.valor} achieved={userWonThisMonthValue} />}
        {globalGoal && <MonthlyGoalCard title="Meta Global do Mês" target={globalGoal.valor} achieved={wonThisMonthValue} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <ChartConfigurator
            title="Novos Leads (Últimos 30 dias)"
            config={leadsChartConfig}
            setConfig={setLeadsChartConfig}
            availableTypes={[
              { value: 'bar', label: 'Barras' },
              { value: 'line', label: 'Linha' },
              { value: 'area', label: 'Área' },
            ]}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {renderLeadsChart()}
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-2">
          <ChartConfigurator
            title="Oportunidades por Etapa"
            config={oppsChartConfig}
            setConfig={setOppsChartConfig}
            availableTypes={[
              { value: 'pie', label: 'Pizza' },
              { value: 'donut', label: 'Donut' },
            ]}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {renderOppsChart()}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;