import { useState } from 'react';
import { InsightCard } from '@/components/insights/InsightCard';
import { Period, PeriodFilter } from '@/components/insights/PeriodFilter';
import { useInsights } from '@/hooks/useInsights';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const InsightsPage = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const { data, isLoading, isError } = useInsights(period);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive">Erro ao carregar insights. Tente novamente mais tarde.</div>;
    }
    if (!data) {
      return <div className="text-muted-foreground">Não há dados para exibir no período selecionado.</div>;
    }

    return (
      <div className="space-y-8">
        {/* Seção de Leads */}
        <section>
          <h2 className="text-xl font-bold mb-4">Leads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard
              title="Volume de Novos Leads"
              value={formatNumber(data.leads.volume.current)}
              change={data.leads.volume.change}
              interpretation="Comparado ao período anterior"
              link="/admin/leads"
            />
            {/* Outros cards de leads viriam aqui */}
          </div>
        </section>

        {/* Seção de Oportunidades */}
        <section>
          <h2 className="text-xl font-bold mb-4">Oportunidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard
              title="Taxa de Ganho"
              value={`${data.opportunities.winRate.current.toFixed(1)}%`}
              change={data.opportunities.winRate.change}
              interpretation="Pontos percentuais vs. período anterior"
              link="/admin/opportunities"
            />
            <InsightCard
              title="Valor do Pipeline Aberto"
              value={formatCurrency(data.opportunities.pipelineValue)}
              interpretation="Valor total de oportunidades em aberto"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.opportunities.oppsChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" name="Oportunidades" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </InsightCard>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insights Automáticos</h1>
          <p className="text-muted-foreground mt-1">Análise de desempenho e tendências do seu processo comercial.</p>
        </div>
        <PeriodFilter period={period} setPeriod={setPeriod} />
      </div>
      {renderContent()}
    </div>
  );
};

export default InsightsPage;