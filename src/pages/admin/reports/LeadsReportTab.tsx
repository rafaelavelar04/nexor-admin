import { ReportCard } from '@/components/reports/ReportCard';
import { EmptyState } from '@/components/reports/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8A2BE2', '#D2691E'];
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const LeadsReportTab = ({ data }: { data: any }) => {
  if (!data) return <EmptyState />;

  const hasData = Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
  if (!hasData) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <ReportCard title="Leads Criados por Período">
        {data.by_date?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_date}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ReportCard>

      <ReportCard title="Leads por Status">
        {data.by_status?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                {data.by_status.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ReportCard>

      <ReportCard title="Leads por Nicho">
        {data.by_niche?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_niche} layout="vertical">
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="nicho" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#8884d8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ReportCard>

      <ReportCard title="Leads por Responsável">
        {data.by_owner?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_owner}>
              <XAxis dataKey="full_name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#00C49F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ReportCard>
      
      <ReportCard title="Leads por Canal" className="lg:col-span-2">
        {data.by_channel?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_channel}>
              <XAxis dataKey="canal" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" fill="#FFBB28" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ReportCard>
    </div>
  );
};