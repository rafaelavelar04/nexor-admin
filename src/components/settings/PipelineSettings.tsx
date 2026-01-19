import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';

type Stage = {
  id: string;
  nome: string;
  probability: number;
};

const PipelineSettings = () => {
  const queryClient = useQueryClient();
  const [stages, setStages] = useState<Stage[]>([]);

  const { isLoading } = useQuery<Stage[]>({
    queryKey: ['pipelineStages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pipeline_stages').select('*').order('ordem');
      if (error) throw error;
      setStages(data || []);
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (updatedStages: Stage[]) => {
      const updates = updatedStages.map(stage => 
        supabase.from('pipeline_stages').update({ probability: stage.probability }).eq('id', stage.id)
      );
      const results = await Promise.all(updates);
      const firstError = results.find(res => res.error);
      if (firstError) throw firstError.error;
    },
    onSuccess: () => {
      showSuccess("Probabilidades do pipeline salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['pipelineStages'] });
    },
    onError: (error: any) => showError(`Erro ao salvar: ${error.message}`),
  });

  const handleProbabilityChange = (id: string, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) return;
    setStages(prev => prev.map(s => s.id === id ? { ...s, probability: numericValue } : s));
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Pipeline</CardTitle>
        <CardDescription>Defina a probabilidade de fechamento (%) para cada estágio do funil de vendas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map(stage => (
          <div key={stage.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <Label htmlFor={`prob-${stage.id}`} className="font-semibold">{stage.nome}</Label>
            <div className="flex items-center gap-2 w-24">
              <Input
                id={`prob-${stage.id}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={stage.probability}
                onChange={(e) => handleProbabilityChange(stage.id, e.target.value)}
                className="text-right"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-4">
          <Button onClick={() => mutation.mutate(stages)} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Probabilidades
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineSettings;