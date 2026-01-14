import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle, Circle, User, Building, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

const statusStyles: Record<string, string> = {
  em_onboarding: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  concluido: "bg-green-500/20 text-green-300 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

const OnboardingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['onboardingDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: onboarding, error: onboardingError } = await supabase
        .from('onboardings')
        .select('*, companies(nome), profiles(full_name), completed_at')
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
      queryClient.invalidateQueries({ queryKey: ['onboardings'] });
    },
    onError: (err: any) => showError(`Erro: ${err.message}`),
  });

  const finalizeOnboardingMutation = useMutation({
    mutationFn: async (onboardingId: string) => {
      const { error } = await supabase
        .from('onboardings')
        .update({ status: 'concluido', completed_at: new Date().toISOString() })
        .eq('id', onboardingId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Onboarding concluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['onboardingDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['onboardings'] });
    },
    onError: (err: any) => showError(`Erro ao finalizar: ${err.message}`),
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

  const { companies, profiles, status, start_date, steps, completed_at } = data;
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isCompleted = status === 'concluido';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl">{companies?.nome}</CardTitle>
              <CardDescription>Processo de Onboarding</CardDescription>
            </div>
            <Badge className={`capitalize ${statusStyles[status] || "bg-gray-500/20"}`}>
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /><span>{companies?.nome}</span></div>
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span>{profiles?.full_name || 'N/A'}</span></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Iniciado em {format(new Date(start_date), 'dd/MM/yyyy', { locale: ptBR })}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Ativação</CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Progress value={progress} className="w-full transition-all duration-500" />
            <span className="text-muted-foreground font-semibold whitespace-nowrap">{Math.round(progress)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          {isCompleted && completed_at && (
            <div className="p-4 mb-6 text-center bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <h3 className="font-bold text-lg text-foreground">Onboarding Concluído!</h3>
              <p className="text-sm text-muted-foreground">
                Este processo foi finalizado em {format(new Date(completed_at), 'dd/MM/yyyy', { locale: ptBR })}.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`w-full flex items-center p-4 rounded-md transition-all duration-200 text-left ${
                  step.completed ? 'bg-green-500/10' : 'bg-secondary hover:bg-secondary/80'
                } ${isCompleted ? 'cursor-not-allowed opacity-70' : ''}`}
                onClick={() => toggleStepMutation.mutate({ stepId: step.id, completed: step.completed })}
                disabled={isCompleted || toggleStepMutation.isPending}
              >
                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mr-4 border-2 rounded-full border-primary text-primary font-bold text-xs">
                  {index + 1}
                </div>
                <span className={`flex-grow ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {step.title}
                </span>
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-400 ml-4 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground ml-4 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
        {progress === 100 && !isCompleted && (
          <CardFooter className="border-t pt-6">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => finalizeOnboardingMutation.mutate(data.id)}
              disabled={finalizeOnboardingMutation.isPending}
            >
              {finalizeOnboardingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Finalizar Onboarding
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default OnboardingDetailPage;