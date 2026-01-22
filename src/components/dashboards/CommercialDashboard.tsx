import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2, Users, Briefcase, Percent, DollarSign } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8A2BE2'];

interface CommercialDashboardProps {
  dateRange: DateRange | undefined;
}

const CommercialDashboard = ({ dateRange }: CommercialDashboardProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['commercialDashboardData', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;
      const { data, error } = await supabase.rpc('get_dashboards_data', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data.commercial;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return <div className="text-destructive mt-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md">Erro ao carregar dados comerciais. Tente atualizar o período.</div>;
  }

  if (!data) {
    return (
      <div className="mt-6">
        <EmptyState icon={<Briefcase className="w-12 h-12" />} title="Sem dados comerciais" description="Não há dados comerciais para exibir no período selecionado." />
      </div>
    );
  }

  const funnelData = [
    { name: 'Leads', value: data.funnel_chart.leads },
    { name: 'Oportunidades', value: data.funnel_chart.opportunities },
    { name: 'Ganhos', value: data.funnel_chart.won },
  ];

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Leads Ativos" value={data.active_leads} icon={<Users />} />
        <KpiCard title="Oportunidades Abertas" value={data.open_opportunities} icon={<Briefcase />} />
        <KpiCard title="Taxa de Conversão" value={`${formatNumber(data.conversion_rate)}%`} icon={<Percent />} />
        <KpiCard title="Ticket Médio" value={formatCurrency(data.avg_ticket_size)} icon={<DollarSign />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title="Funil de Vendas (Período)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#fff' }} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
        <ReportCard title="Top 5 Nichos de Leads">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.leads_by_niche_chart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.leads_by_niche_chart.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>
    </div>
  );
};

export default CommercialDashboard;