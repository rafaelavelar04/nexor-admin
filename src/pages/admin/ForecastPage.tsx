import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Target, TrendingUp, CheckCircle, BarChart, PiggyBank, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatCurrency } from '@/lib/formatters';
import { addMonths, subMonths, startOfMonth, endOfMonth, format, eachDayOfInterval, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmptyState } from '@/components/common/EmptyState';

const ForecastPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['financialForecastData', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data: receivables, error: receivablesError } = await supabase
        .from('contract_receivables')
        .select('amount, status, paid_at, due_date')
        .gte('due_date', start.toISOString())
        .lte('due_date', end.toISOString());
      if (receivablesError) throw receivablesError;

      const { data: costs, error: costsError } = await supabase
        .from('partner_costs')
        .select('valor, status, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (costsError) throw costsError;

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('valor')
        .eq('mes', currentMonth.getMonth() + 1)
        .eq('ano', currentMonth.getFullYear())
        .is('responsavel_id', null)
        .single();
      if (goalError && goalError.code !== 'PGRST116') throw goalError;

      return { receivables, costs, goal: goal?.valor || 0 };
    },
  });

  const forecast = useMemo(() => {
    if (!data) return null;

    const { receivables, costs, goal } = data;

    const receitaRealizada = receivables
      .filter(r => r.status === 'pago')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const receitaPrevista = receivables
      .filter(r => r.status !== 'pago')
      .reduce((sum, r) => sum + r.amount, 0);

    const custosPagos = costs
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + c.valor, 0);

    const custosPrevistos = costs
      .filter(c => c.status === 'previsto')
      .reduce((sum, c) => sum + c.valor, 0);

    const margemProjetada = (receitaRealizada + receitaPrevista) - (custosPagos + custosPrevistos);

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const dailyChartData = daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dailyRevenue = receivables
        .filter(r => r.paid_at && format(new Date(r.paid_at), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, r) => sum + r.amount, 0);
      const dailyCosts = costs
        .filter(c => c.status === 'pago' && format(new Date(c.created_at), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, c) => sum + c.valor, 0);
      return {
        name: `${getDate(day)}`,
        Receita: dailyRevenue,
        Custos: dailyCosts,
      };
    });

    return {
      goal,
      receitaRealizada,
      receitaPrevista,
      custosPagos,
      custosPrevistos,
      margemProjetada,
      dailyChartData,
    };
  }, [data, currentMonth]);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  
  if (isError) return (
    <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">
      <strong>Erro ao carregar dados do forecast:</strong> {error?.message}
    </div>
  );

  if (!forecast || (forecast.receitaRealizada === 0 && forecast.receitaPrevista === 0 && forecast.custosPagos === 0 && forecast.custosPrevistos === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Forecast Financeiro</h1>
            <p className="text-muted-foreground mt-1">Previsão de receita, custos e margem com base nos seus contratos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Mês Anterior</Button>
            <span className="font-semibold w-32 text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Próximo Mês</Button>
          </div>
        </div>
        <EmptyState
          icon={<BarChart className="w-12 h-12" />}
          title="Nenhum dado financeiro encontrado"
          description="Não há recebíveis ou custos registrados para o período selecionado. Crie contratos e lance custos para começar a usar o forecast."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast Financeiro</h1>
          <p className="text-muted-foreground mt-1">Previsão de receita, custos e margem com base nos seus contratos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Mês Anterior</Button>
          <span className="font-semibold w-32 text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
          <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Próximo Mês</Button>
        </div>
      </div>

      {(forecast.receitaRealizada + forecast.receitaPrevista) < forecast.goal && forecast.goal > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <CardTitle className="text-yellow-300">Alerta: Previsão Abaixo da Meta</CardTitle>
              <CardDescription className="text-yellow-400/80">
                A receita total projetada ({formatCurrency(forecast.receitaRealizada + forecast.receitaPrevista)}) está {formatCurrency(forecast.goal - (forecast.receitaRealizada + forecast.receitaPrevista))} abaixo da meta de {formatCurrency(forecast.goal)}.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Receita Realizada" value={formatCurrency(forecast.receitaRealizada)} icon={<CheckCircle className="text-green-400" />} />
        <KpiCard title="Receita Prevista" value={formatCurrency(forecast.receitaPrevista)} icon={<TrendingUp className="text-cyan-400" />} />
        <KpiCard title="Custos Pagos" value={formatCurrency(forecast.custosPagos)} icon={<CheckCircle className="text-green-400" />} />
        <KpiCard title="Custos Previstos" value={formatCurrency(forecast.custosPrevistos)} icon={<TrendingDown className="text-red-400" />} />
        <KpiCard title="Margem Projetada" value={formatCurrency(forecast.margemProjetada)} icon={<PiggyBank className="text-yellow-400" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Fluxo de Caixa Diário (Realizado)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={forecast.dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Receita" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custos" fill="#f87171" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastPage;