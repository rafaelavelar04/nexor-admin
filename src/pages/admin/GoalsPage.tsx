import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';

export type Goal = {
  id: string;
  valor: number;
  mes: number;
  ano: number;
  responsavel_id: string | null;
  profiles: { full_name: string } | null;
};

const GoalsPage = () => {
  const { profile } = useSession();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['goalsAndPerformance'],
    queryFn: async () => {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*, profiles!responsavel_id(full_name)')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      if (goalsError) throw goalsError;

      const { data: wonOpps, error: oppsError } = await supabase
        .from('opportunities')
        .select('valor_estimado, closed_at, responsavel_id')
        .eq('status', 'won')
        .not('closed_at', 'is', null);
      if (oppsError) throw oppsError;

      return { goals: goals || [], wonOpps: wonOpps || [] };
    }
  });

  const canManage = profile?.role === 'admin';

  const goalsWithPerformance = useMemo(() => {
    if (!data) return [];

    return data.goals.map(goal => {
      const achieved = data.wonOpps
        .filter(opp => {
          if (!opp.closed_at) return false;
          const closedAt = new Date(opp.closed_at);
          const sameMonth = closedAt.getMonth() + 1 === goal.mes;
          const sameYear = closedAt.getFullYear() === goal.ano;
          const sameResponsible = !goal.responsavel_id || opp.responsavel_id === goal.responsavel_id;
          return sameMonth && sameYear && sameResponsible;
        })
        .reduce((sum, opp) => sum + (opp.valor_estimado || 0), 0);
      
      return { ...goal, achieved };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">
        Erro ao carregar as metas. Por favor, tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas Comerciais</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipe em relação aos objetivos.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        )}
      </div>
      
      {goalsWithPerformance.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goalsWithPerformance.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
          <Target className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Nenhuma meta definida</h3>
          <p className="text-muted-foreground text-sm">Crie a primeira meta para começar o acompanhamento.</p>
        </div>
      )}

      <GoalFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default GoalsPage;