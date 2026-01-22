import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2, DollarSign, Percent, PiggyBank } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';

interface FinancialDashboardProps {
  dateRange: DateRange | undefined;
}

const FinancialDashboard = ({ dateRange }: FinancialDashboardProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['financialDashboardData', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;
      const { data, error } = await supabase.rpc('get_dashboards_data', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data.financial;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return <div className="text-destructive mt-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md">Erro ao carregar dados financeiros. Tente atualizar o período.</div>;
  }

  if (!data) {
    return (
      <div className="mt-6">
        <EmptyState icon={<DollarSign className="w-12 h-12" />} title="Sem dados financeiros" description="Não há dados financeiros para exibir no período selecionado." />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Receita Prevista" value={formatCurrency(data.revenue_forecasted)} icon={<DollarSign />} />
        <KpiCard title="Receita Recebida" value={formatCurrency(data.revenue_received)} icon={<DollarSign />} />
        <KpiCard title="Custos Previstos" value={formatCurrency(data.costs_forecasted)} icon={<DollarSign />} />
        <KpiCard title="Custos Pagos" value={formatCurrency(data.costs_paid)} icon={<DollarSign />} />
        <KpiCard title="Margem Média" value={`${formatNumber(data.avg_margin)}%`} icon={<Percent />} />
        <KpiCard title="Caixa Projetado" value={formatCurrency(data.cash_flow_projected)} icon={<PiggyBank />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title="Receita vs. Custos (Realizado)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue_vs_costs_chart}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Receita" fill="#82ca9d" />
              <Bar dataKey="costs" name="Custos" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
        <ReportCard title="Top 5 Custos por Parceiro">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_partner_costs_chart} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={120} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" name="Custo" fill="#8884d8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>
    </div>
  );
};

export default FinancialDashboard;