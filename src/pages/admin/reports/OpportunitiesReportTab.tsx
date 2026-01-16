import { ReportCard } from '@/components/reports/ReportCard';
import { EmptyState } from '@/components/reports/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DollarSign, Percent, Trophy, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['#00C49F', '#FF8042'];

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>{`${pld.name}: ${formatter ? formatter(pld.value) : pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const OpportunitiesReportTab = ({ data }: { data: any }) => {
  if (!data) return <EmptyState />;

  const wonCount = data.won_lost?.find((d: any) => d.status === 'won')?.count || 0;
  const lostCount = data.won_lost?.find((d: any) => d.status === 'lost')?.count || 0;
  const totalClosed = wonCount + lostCount;
  const conversionRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;
  const totalValueWon = data.value_won_by_date?.reduce((acc: number, curr: any) => acc + curr.value, 0) || 0;

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Oportunidades Ganhas" value={wonCount} icon={<Trophy className="h-5 w-5 text-green-400" />} />
        <KpiCard title="Oportunidades Perdidas" value={lostCount} icon={<XCircle className="h-5 w-5 text-red-400" />} />
        <KpiCard title="Taxa de Conversão" value={`${conversionRate.toFixed(1)}%`} icon={<Percent className="h-5 w-5 text-cyan-400" />} />
        <KpiCard title="Valor Total Ganho" value={formatCurrency(totalValueWon)} icon={<DollarSign className="h-5 w-5 text-yellow-400" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title="Oportunidades Ganhas vs. Perdidas">
          {data.won_lost?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.won_lost} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                  {data.won_lost.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'won' ? COLORS[0] : COLORS[1]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ReportCard>

        <ReportCard title="Valor Ganho por Período">
          {data.value_won_by_date?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.value_won_by_date}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                <Bar dataKey="value" name="Valor Ganho" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ReportCard>

        <ReportCard title="Valor Ganho por Responsável" className="lg:col-span-2">
          {data.value_won_by_owner?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.value_won_by_owner}>
                <XAxis dataKey="full_name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                <Bar dataKey="value" name="Valor Ganho" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ReportCard>
      </div>
    </div>
  );
};