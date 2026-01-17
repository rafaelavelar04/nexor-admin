import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { MonthlyGoalCard } from '@/components/dashboard/MonthlyGoalCard';
import { Loader2, Users, Briefcase, Target, BarChart, DollarSign } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell } from 'recharts';
import { subDays, startOfMonth, isWithinInterval, format } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { formatCurrency } from '@/lib/formatters';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const { user } = useSession();

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

      return { leads, opportunities, goals };
    }
  });

  const processedData = useMemo(() => {
    if (!data) return null;

    const { leads, opportunities } = data;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // Leads nos últimos 30 dias
    const recentLeads = leads.filter(l => new Date(l.created_at) > thirtyDaysAgo);
    const leadsByDay = recentLeads.reduce((acc, lead) => {
      const day = format(new Date(lead.created_at), 'dd/MM');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const leadsChartData = Object.keys(leadsByDay).map(day => ({ date: day, leads: leadsByDay[day] }));

    // Oportunidades por etapa
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

  const { opportunities, goals } = data;

  // KPI Calculations
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  
  const wonThisMonth = opportunities.filter(o => o.status === 'won' && o.closed_at && isWithinInterval(new Date(o.closed_at), { start: startOfCurrentMonth, end: now }));
  const wonThisMonthValue = wonThisMonth.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const totalLeads = data.leads.length;
  const openOpportunities = opportunities.filter(o => o.status === 'open').length;
  const pipelineValue = opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const globalGoal = goals.find(g => g.responsavel_id === null);
  const userGoal = user ? goals.find(g => g.responsavel_id === user.id) : null;
  
  const userWonThisMonthValue = wonThisMonth
    .filter(o => o.responsavel_id === user?.id)
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do desempenho comercial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Leads Ativos" value={totalLeads} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Oportunidades Abertas" value={openOpportunities} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Valor do Pipeline" value={formatCurrency(pipelineValue)} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Ganhos no Mês" value={formatCurrency(wonThisMonthValue)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userGoal && <MonthlyGoalCard title="Minha Meta do Mês" target={userGoal.valor} achieved={userWonThisMonthValue} />}
        {globalGoal && <MonthlyGoalCard title="Meta Global do Mês" target={globalGoal.valor} achieved={wonThisMonthValue} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart title="Novos Leads (Últimos 30 dias)">
          <RechartsBarChart data={processedData?.leadsChartData}>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </DashboardChart>
        <DashboardChart title="Oportunidades por Etapa">
          <PieChart>
            <Pie data={processedData?.oppsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {processedData?.oppsChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
          </PieChart>
        </DashboardChart>
      </div>
    </div>
  );
};

export default Dashboard;