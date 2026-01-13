import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardChart } from '@/components/dashboard/DashboardChart';
import { Loader2, Users, Briefcase, Target, CheckCircle, BarChart, DollarSign } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell, Line, LineChart } from 'recharts';
import { subDays, startOfMonth, isWithinInterval } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const { data: leads, error: leadsError } = await supabase.from('leads').select('*');
      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase.from('opportunities').select('*, pipeline_stage:pipeline_stages(nome, ordem)');
      if (oppsError) throw oppsError;

      return { leads, opportunities };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (isError || !data) {
    return <div className="text-red-400">Erro ao carregar os dados do dashboard.</div>;
  }

  const { leads, opportunities } = data;

  // KPI Calculations
  const totalLeads = leads.length;
  const prospectingLeads = leads.filter(l => l.status !== 'Não interessado').length;
  const openOpportunities = opportunities.filter(o => o.status === 'open').length;
  const wonOpportunities = opportunities.filter(o => o.status === 'won').length;
  const pipelineValue = opportunities
    .filter(o => o.status === 'open')
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
  
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const wonThisMonthValue = opportunities
    .filter(o => o.status === 'won' && o.closed_at && isWithinInterval(new Date(o.closed_at), { start: startOfCurrentMonth, end: now }))
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  // Chart Data Processing
  const leadsByStatusData = Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const opportunitiesByStageData = Object.entries(
    opportunities
      .filter(o => o.status === 'open' && o.pipeline_stage)
      .reduce((acc, opp) => {
        const stageName = opp.pipeline_stage.nome;
        acc[stageName] = (acc[stageName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const thirtyDaysAgo = subDays(now, 30);
  const revenueLast30DaysData = opportunities
    .filter(o => o.status === 'won' && o.closed_at && new Date(o.closed_at) >= thirtyDaysAgo)
    .reduce((acc, opp) => {
      const date = new Date(opp.closed_at!).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (opp.valor_estimado || 0);
      return acc;
    }, {} as Record<string, number>);
  
  const formattedRevenueData = Object.entries(revenueLast30DaysData)
    .map(([date, revenue]) => ({ date, Ganhos: revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      <p className="text-gray-400 mt-2 mb-6">Visão geral do desempenho comercial.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Total de Leads" value={totalLeads} icon={<Users className="h-4 w-4 text-gray-500" />} />
        <KpiCard title="Leads em Prospecção" value={prospectingLeads} icon={<Target className="h-4 w-4 text-gray-500" />} />
        <KpiCard title="Oportunidades Abertas" value={openOpportunities} icon={<Briefcase className="h-4 w-4 text-gray-500" />} />
        <KpiCard title="Oportunidades Ganhas" value={wonOpportunities} icon={<CheckCircle className="h-4 w-4 text-gray-500" />} />
        <KpiCard title="Valor do Pipeline" value={currencyFormatter.format(pipelineValue)} icon={<BarChart className="h-4 w-4 text-gray-500" />} />
        <KpiCard title="Ganhos no Mês" value={currencyFormatter.format(wonThisMonthValue)} icon={<DollarSign className="h-4 w-4 text-gray-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <DashboardChart title="Leads por Status">
          <PieChart>
            <Pie data={leadsByStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {leadsByStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} leads`} />
            <Legend />
          </PieChart>
        </DashboardChart>

        <DashboardChart title="Oportunidades por Etapa do Pipeline">
          <RechartsBarChart data={opportunitiesByStageData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={100} stroke="#a1a1aa" fontSize={12} />
            <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} formatter={(value) => `${value} op.`} />
            <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
          </RechartsBarChart>
        </DashboardChart>

        <DashboardChart title="Ganhos nos Últimos 30 Dias">
          <LineChart data={formattedRevenueData}>
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR')} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => currencyFormatter.format(value as number)} />
            <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="Ganhos" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </DashboardChart>
      </div>
    </div>
  );
};

export default Dashboard;