import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { OnboardingListCard } from '@/components/onboarding/OnboardingListCard';
import { OnboardingFormDialog } from '@/components/onboarding/OnboardingFormDialog';

const OnboardingPage = () => {
  const { profile } = useSession();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['onboardings'],
    queryFn: async () => {
      const { data: onboardings, error } = await supabase
        .from('onboardings')
        .select('*, companies(nome), profiles(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: steps, error: stepsError } = await supabase
        .from('onboarding_steps')
        .select('onboarding_id, completed');
      if (stepsError) throw stepsError;

      const stepsByOnboarding = steps.reduce((acc, step) => {
        if (!acc[step.onboarding_id]) {
          acc[step.onboarding_id] = [];
        }
        acc[step.onboarding_id].push(step);
        return acc;
      }, {} as Record<string, typeof steps>);

      return onboardings.map(o => {
        const relatedSteps = stepsByOnboarding[o.id] || [];
        const completed_steps = relatedSteps.filter(s => s.completed).length;
        const total_steps = relatedSteps.length;
        const progress = total_steps > 0 ? (completed_steps / total_steps) * 100 : 0;
        return { ...o, progress, completed_steps, total_steps };
      });
    },
  });

  const canManage = profile?.role === 'admin' || profile?.role === 'operacoes';

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar os processos de onboarding.</div>;
    }
    if (!data || data.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardCheck className="w-12 h-12" />}
          title="Nenhum onboarding em andamento"
          description="Inicie o processo de onboarding para um novo cliente para acompanhá-lo aqui."
          cta={canManage ? { text: "Iniciar Onboarding", onClick: () => setIsFormOpen(true) } : undefined}
        />
      );
    }
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map(onboarding => (
          <OnboardingListCard key={onboarding.id} onboarding={onboarding} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding de Clientes</h1>
          <p className="text-muted-foreground mt-1">Acompanhe a ativação e o sucesso inicial dos seus clientes.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Iniciar Onboarding
          </Button>
        )}
      </div>
      
      {renderContent()}

      <OnboardingFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default OnboardingPage;