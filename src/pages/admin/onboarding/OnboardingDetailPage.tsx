import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle, Circle, User, Building, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';

const OnboardingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['onboardingDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: onboarding, error: onboardingError } = await supabase
        .from('onboardings')
        .select('*, companies(nome), profiles(full_name)')
        .eq('id', id)
        .single();
      if (onboardingError) throw onboardingError;

      const { data: steps, error: stepsError } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('onboarding_id', id)
        .order('order_index', { ascending: true });
      if (stepsError) throw stepsError;

      return { ...onboarding, steps };
    },
    enabled: !!id,
  });

  const toggleStepMutation = useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: string, completed: boolean }) => {
      const { error } = await supabase
        .from('onboarding_steps')
        .update({ completed: !completed })
        .eq('id', stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Etapa atualizada!");
      queryClient.invalidateQueries({ queryKey: ['onboardingDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['onboardings'] }); // Invalidate list for progress update
    },
    onError: (err: any) => showError(`Erro: ${err.message}`),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 bg-red-500/10 p-6 rounded-md">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-white">Erro ao Carregar Onboarding</h2>
        <p className="text-center text-red-300">{error?.message}</p>
      </div>
    );
  }

  if (!data) return <div>Onboarding não encontrado.</div>;

  const { companies, profiles, status, start_date, steps } = data;
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{companies?.nome}</CardTitle>
          <CardDescription>Processo de Onboarding</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /><span>{companies?.nome}</span></div>
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span>{profiles?.full_name || 'N/A'}</span></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Iniciado em {format(new Date(start_date), 'dd/MM/yyyy')}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Ativação</CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Progress value={progress} className="w-full" />
            <span className="text-muted-foreground font-semibold whitespace-nowrap">{Math.round(progress)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map(step => (
              <div
                key={step.id}
                className={`flex items-center p-4 rounded-md transition-colors cursor-pointer ${step.completed ? 'bg-green-500/10' : 'bg-secondary'}`}
                onClick={() => toggleStepMutation.mutate({ stepId: step.id, completed: step.completed })}
              >
                {step.completed ? <CheckCircle className="w-6 h-6 text-green-400 mr-4" /> : <Circle className="w-6 h-6 text-muted-foreground mr-4" />}
                <span className={`flex-grow ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingDetailPage;