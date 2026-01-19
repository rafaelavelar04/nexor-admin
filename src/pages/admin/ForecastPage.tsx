import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Target, TrendingUp, CheckCircle, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatCurrency } from '@/lib/formatters';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ForecastPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['forecastData', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data: opportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('valor_estimado, status, closed_at, expected_close_date, pipeline_stage:pipeline_stages(nome, probability)')
        .or(`and(status.eq.won,closed_at.gte.${start.toISOString()},closed_at.lte.${end.toISOString()}),and(status.eq.open,expected_close_date.gte.${start.toISOString()},expected_close_date.lte.${end.toISOString()})`);
      if (oppsError) throw oppsError;

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('valor')
        .eq('mes', currentMonth.getMonth() + 1)
        .eq('ano', currentMonth.getFullYear())
        .is('responsavel_id', null)
        .single();
      if (goalError && goalError.code !== 'PGRST116') throw goalError;

      return { opportunities, goal: goal?.valor || 0 };
    },
  });

  const forecast = useMemo(() => {
    if (!data) return null;

    const confirmed = data.opportunities
      .filter(o => o.status === 'won')
      .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

    const openOpps = data.opportunities.filter(o => o.status === 'open');

    const realistic = openOpps.reduce((sum, o) => {
      const probability = o.pipeline_stage?.probability || 0;
      return sum + ((o.valor_estimado || 0) * (probability / 100));
    }, 0);

    const optimistic = openOpps.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
    
    const conservative = openOpps
      .filter(o => (o.pipeline_stage?.probability || 0) >= 50)
      .reduce((sum, o) => sum + ((o.valor_estimado || 0) * (o.pipeline_stage?.probability / 100)), 0);

    const stagesBreakdown = openOpps.reduce((acc, o) => {
      const stageName = o.pipeline_stage?.nome || 'Sem Estágio';
      if (!acc[stageName]) {
        acc[stageName] = { count: 0, totalValue: 0, weightedValue: 0, probability: o.pipeline_stage?.probability || 0 };
      }
      acc[stageName].count++;
      acc[stageName].totalValue += o.valor_estimado || 0;
      acc[stageName].weightedValue += ((o.valor_estimado || 0) * (acc[stageName].probability / 100));
      return acc;
    }, {} as Record<string, { count: number; totalValue: number; weightedValue: number; probability: number }>);

    return {
      confirmed,
      realistic,
      optimistic,
      conservative,
      goal: data.goal,
      totalForecast: confirmed + realistic,
      stagesBreakdown: Object.entries(stagesBreakdown).map(([name, values]) => ({ name, ...values })),
    };
  }, [data]);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError) return <div className="text-destructive">Erro ao carregar dados do forecast.</div>;

  const chartData = [{
    name: 'Cenários',
    Meta: forecast?.goal,
    Confirmado: forecast?.confirmed,
    Realista: forecast?.totalForecast,
    Otimista: (forecast?.confirmed || 0) + (forecast?.optimistic || 0),
  }];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast de Vendas</h1>
          <p className="text-muted-foreground mt-1">Previsão de receita e fechamentos com base no seu pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Mês Anterior</Button>
          <span className="font-semibold w-32 text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
          <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Próximo Mês</Button>
        </div>
      </div>

      {forecast && forecast.totalForecast < forecast.goal && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <CardTitle className="text-yellow-300">Alerta: Previsão Abaixo da Meta</CardTitle>
              <CardDescription className="text-yellow-400/80">
                A previsão realista ({formatCurrency(forecast.totalForecast)}) está {formatCurrency(forecast.goal - forecast.totalForecast)} abaixo da meta de {formatCurrency(forecast.goal)}.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Meta do Mês" value={formatCurrency(forecast?.goal)} icon={<Target />} />
        <KpiCard title="Receita Confirmada" value={formatCurrency(forecast?.confirmed)} icon={<CheckCircle />} />
        <KpiCard title="Forecast Realista" value={formatCurrency(forecast?.totalForecast)} icon={<TrendingUp />} description="Confirmado + Ponderado" />
        <KpiCard title="Pipeline do Mês" value={formatCurrency(forecast?.optimistic)} icon={<BarChart />} description="Valor total em aberto" />
      </div>

      <Card>
        <CardHeader><CardTitle>Previsão vs. Meta</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={chartData}>
              <XAxis dataKey="name" hide />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Meta" fill="#8884d8" />
              <Bar dataKey="Confirmado" stackId="a" fill="#4ade80" />
              <Bar dataKey="Realista" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Otimista" stackId="b" fill="#facc15" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Forecast por Estágio do Funil</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estágio</TableHead>
                  <TableHead className="text-center">Prob. (%)</TableHead>
                  <TableHead className="text-center">Oportunidades</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Valor Ponderado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast?.stagesBreakdown.map(stage => (
                  <TableRow key={stage.name}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell className="text-center">{stage.probability.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{stage.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stage.totalValue)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(stage.weightedValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastPage;