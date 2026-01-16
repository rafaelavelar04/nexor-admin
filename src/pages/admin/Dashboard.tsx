import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { FollowUpListCard } from '@/components/dashboard/FollowUpListCard';
import { MonthlyGoalCard } from '@/components/dashboard/MonthlyGoalCard';
import { Loader2, Users, Briefcase, Target, CheckCircle, BarChart, DollarSign } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell, Line, LineChart } from 'recharts';
import { subDays, startOfMonth, isWithinInterval, isBefore, isToday, startOfToday } from 'date-fns';
import { useSession } from '@/contexts/SessionContext';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const { user } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const { data: leads, error: leadsError } = await supabase.from('leads').select('*, responsavel:profiles(full_name)');
      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase.from('opportunities').select('*, pipeline_stage:pipeline_stages(nome, ordem), responsavel:profiles(full_name)');
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (isError || !data) {
    return <div className="text-red-400">Erro ao carregar os dados do dashboard.</div>;
  }

  const { leads, opportunities, goals } = data;

  // KPI & Goal Calculations
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  
  const wonThisMonth = opportunities.filter(o => o.status === 'won' && o.closed_at && isWithinInterval(new Date(o.closed_at), { start: startOfCurrentMonth, end: now }));
  const wonThisMonthValue = wonThisMonth.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const totalLeads = leads.length;
  const openOpportunities = opportunities.filter(o => o.status === 'open').length;
  const pipelineValue = opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const globalGoal = goals.find(g => g.responsavel_id === null);
  const userGoal = user ? goals.find(g => g.responsavel_id === user.id) : null;
  
  const userWonThisMonthValue = wonThisMonth
    .filter(o => o.responsavel_id === user?.id)
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  // Follow-up Calculations
  const today = startOfToday();
  const allFollowUps = [
    ...leads.filter(l => l.proximo_followup).map(l => ({ id: l.id, type: 'Lead' as const, name: l.nome, responsible: l.responsavel?.full_name || 'N/A', date: l.proximo_followup! })),
    ...opportunities.filter(o => o.proximo_followup).map(o => ({ id: o.id, type: 'Oportunidade' as const, name: o.titulo, responsible: o.responsavel?.full_name || 'N/A', date: o.proximo_followup! }))
  ];
  const overdueFollowUps = allFollowUps.filter(f => isBefore(new Date(f.date), today));
  const todayFollowUps = allFollowUps.filter(f => isToday(new Date(f.date)));

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
        <FollowUpListCard title="Follow-ups Atrasados" items={overdueFollowUps} badgeText="Atrasados" badgeClass="bg-red-500/80 text-white" />
        <FollowUpListCard title="Follow-ups de Hoje" items={todayFollowUps} badgeText="para Hoje" badgeClass="bg-yellow-500/80 text-white" />
      </div>
    </div>
  );
};

export default Dashboard;