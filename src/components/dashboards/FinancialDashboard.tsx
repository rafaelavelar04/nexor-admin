import { KpiCard } from '@/components/dashboard/KpiCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, Percent, PiggyBank } from 'lucide-react';

const FinancialDashboard = ({ data }: { data: any }) => {
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