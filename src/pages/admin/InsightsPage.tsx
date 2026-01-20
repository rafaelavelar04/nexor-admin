import { useState } from 'react';
import { Period, PeriodFilter } from '@/components/insights/PeriodFilter';
import { useOperationalInsights } from '@/hooks/useOperationalInsights';
import { Loader2, Trophy, Zap, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { AIOpsInsightCard } from '@/components/insights/AIOpsInsightCard';
import { EmptyState } from '@/components/common/EmptyState';

const InsightsPage = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const { data, isLoading, isError } = useOperationalInsights(period);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive">Erro ao gerar insights. Tente novamente mais tarde.</div>;
    }
    if (!data || (!data.bestNiche && !data.salesCycle && !data.topRep)) {
      return <EmptyState icon={<Zap className="w-12 h-12" />} title="Poucos dados para análise" description="Continue usando o sistema para que a IA possa gerar insights valiosos para você." />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.bestNiche && (
          <AIOpsInsightCard
            icon={<Trophy className="w-6 h-6" />}
            title="Nicho com Maior Conversão"
            insight={data.bestNiche.name}
            explanation={`Converteu ${data.bestNiche.rate.toFixed(1)}% das oportunidades no período. Considere focar mais esforços de prospecção aqui.`}
          />
        )}
        {data.salesCycle && (
          <AIOpsInsightCard
            icon={<Clock className="w-6 h-6" />}
            title="Ciclo de Venda Médio"
            insight={`${data.salesCycle.days} dias`}
            explanation={`Este é o tempo médio entre a criação de uma oportunidade e seu fechamento como "ganha".`}
          />
        )}
        {data.topRep && (
          <AIOpsInsightCard
            icon={<Trophy className="w-6 h-6" />}
            title="Vendedor Destaque"
            insight={data.topRep.name}
            explanation={`Gerou ${formatCurrency(data.topRep.value)} em oportunidades ganhas no período.`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise Inteligente</h1>
          <p className="text-muted-foreground mt-1">Insights gerados por IA com base nos dados da sua operação.</p>
        </div>
        <PeriodFilter period={period} setPeriod={setPeriod} />
      </div>
      {renderContent()}
    </div>
  );
};

export default InsightsPage;