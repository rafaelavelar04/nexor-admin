import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const InternalNotes = ({ opportunity, canEdit }: { opportunity: any, canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(opportunity.notes || '');

  const mutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { error } = await supabase
        .from('opportunities')
        .update({ notes: newNotes })
        .eq('id', opportunity.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Notas salvas!");
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] });
    },
    onError: (error) => showError(`Erro ao salvar notas: ${error.message}`),
  });

  const handleSave = () => {
    mutation.mutate(notes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">Notas Internas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione notas sobre a negociação, próximos passos, etc."
          rows={8}
          disabled={!canEdit}
        />
        {canEdit && (
          <Button onClick={handleSave} disabled={mutation.isPending} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Notas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};