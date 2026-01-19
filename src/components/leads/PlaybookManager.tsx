import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Playbook } from '../settings/PlaybookSettings';

interface PlaybookManagerProps {
  lead: any;
}

export const PlaybookManager = ({ lead }: PlaybookManagerProps) => {
  const queryClient = useQueryClient();

  const { data: playbook, isLoading } = useQuery<Playbook | null>({
    queryKey: ['playbookForNicho', lead.nicho],
    queryFn: async () => {
      if (!lead.nicho) return null;
      const { data, error } = await supabase.from('playbooks').select('*, playbook_steps(*)').eq('nicho', lead.nicho).single();
      if (error) return null;
      return { ...data, steps: data.playbook_steps.sort((a, b) => a.order - b.order) };
    },
    enabled: !!lead.nicho,
  });

  const mutation = useMutation({
    mutationFn: async (newStepId: string | null) => {
      const { error } = await supabase.from('leads').update({ current_playbook_step_id: newStepId }).eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
    },
    onError: (error: any) => showError(error.message),
  });

  const handleStepChange = (direction: 'next' | 'prev') => {
    if (!playbook) return;
    const currentStepIndex = playbook.steps.findIndex(s => s.id === lead.current_playbook_step_id);
    
    if (direction === 'next') {
      if (currentStepIndex > -1 && currentStepIndex < playbook.steps.length - 1) {
        mutation.mutate(playbook.steps[currentStepIndex + 1].id);
      } else if (currentStepIndex === -1 && playbook.steps.length > 0) {
        mutation.mutate(playbook.steps[0].id);
      }
    } else {
      if (currentStepIndex > 0) {
        mutation.mutate(playbook.steps[currentStepIndex - 1].id);
      } else if (currentStepIndex === 0) {
        mutation.mutate(null);
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Script copiado!");
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
  if (!lead.nicho) return null;
  if (!playbook) return (
    <Card className="bg-secondary/50 border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Playbook de Vendas</CardTitle>
        <CardDescription>Nenhum playbook encontrado para o nicho "{lead.nicho}".</CardDescription>
      </CardHeader>
    </Card>
  );

  const currentStep = playbook.steps.find(s => s.id === lead.current_playbook_step_id);
  const currentStepIndex = playbook.steps.findIndex(s => s.id === lead.current_playbook_step_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{playbook.name}</CardTitle>
        <CardDescription>Siga as etapas para qualificar este lead.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {playbook.steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${index <= currentStepIndex ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-border'}`}>
                {index < currentStepIndex ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              {index < playbook.steps.length - 1 && <div className={`flex-grow h-0.5 w-8 sm:w-16 ${index < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Current Step Details */}
        {currentStep ? (
          <div className="p-4 bg-secondary/50 rounded-md space-y-4">
            <h4 className="font-bold text-lg">Etapa: {currentStep.objective}</h4>
            {currentStep.checklist && currentStep.checklist.length > 0 && (
              <div>
                <h5 className="font-semibold mb-2">Checklist</h5>
                <div className="space-y-2">
                  {currentStep.checklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox id={`checklist-${index}`} />
                      <Label htmlFor={`checklist-${index}`}>{item.text}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentStep.script && (
              <div>
                <h5 className="font-semibold mb-2">Script Sugerido</h5>
                <div className="relative p-3 bg-background rounded-md text-sm">
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleCopyToClipboard(currentStep.script!)}><Copy className="w-4 h-4" /></Button>
                  <pre className="whitespace-pre-wrap font-sans">{currentStep.script}</pre>
                </div>
              </div>
            )}
            {currentStep.internal_notes && (
              <div>
                <h5 className="font-semibold mb-2">Observações Internas</h5>
                <p className="text-sm text-muted-foreground p-3 bg-background rounded-md">{currentStep.internal_notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Playbook não iniciado.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => handleStepChange('prev')} disabled={mutation.isPending || currentStepIndex < 0}>
            Etapa Anterior
          </Button>
          <Button onClick={() => handleStepChange('next')} disabled={mutation.isPending || currentStepIndex === playbook.steps.length - 1}>
            Próxima Etapa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};