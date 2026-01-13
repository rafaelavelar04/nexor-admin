import { ReportCard } from '@/components/reports/ReportCard';
import { EmptyState } from '@/components/reports/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        <p style={{ color: payload[0].fill }}>{`Quantidade: ${payload[0].value}`}</p>
        <p style={{ color: payload[1].fill }}>{`Valor: ${currencyFormatter.format(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

export const PipelineReportTab = ({ data }: { data: any }) => {
  if (!data || !data.snapshot || data.snapshot.length === 0) {
    return <EmptyState message="Não há oportunidades abertas no pipeline para exibir." />;
  }

  return (
    <div className="mt-6">
      <ReportCard title="Snapshot do Pipeline (Oportunidades Abertas)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.snapshot}>
            <XAxis dataKey="stage_name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => currencyFormatter.format(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Quantidade" fill="#8884d8" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="value" name="Valor" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>
    </div>
  );
};