import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { NICHOS } from '@/lib/constants';
import { Playbook } from './PlaybookSettings';

const checklistItemSchema = z.object({ text: z.string().min(1, "O texto do item é obrigatório.") });
const stepSchema = z.object({
  id: z.string().uuid().optional(),
  objective: z.string().min(3, "O objetivo é obrigatório."),
  checklist: z.array(checklistItemSchema).optional(),
  script: z.string().optional(),
  internal_notes: z.string().optional(),
});

const playbookSchema = z.object({
  name: z.string().min(3, "O nome do playbook é obrigatório."),
  nicho: z.string().min(1, "Selecione um nicho."),
  steps: z.array(stepSchema).min(1, "Adicione pelo menos uma etapa."),
});

type PlaybookFormData = z.infer<typeof playbookSchema>;

interface PlaybookFormProps {
  playbook: Playbook | null;
  onCancel: () => void;
}

export const PlaybookForm = ({ playbook, onCancel }: PlaybookFormProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!playbook;

  const form = useForm<PlaybookFormData>({
    resolver: zodResolver(playbookSchema),
    defaultValues: isEditMode
      ? { name: playbook.name, nicho: playbook.nicho, steps: playbook.steps.map(s => ({ ...s, checklist: s.checklist?.map(c => ({ text: c.text })) || [] })) }
      : { name: '', nicho: '', steps: [{ objective: '', checklist: [], script: '', internal_notes: '' }] },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const mutation = useMutation({
    mutationFn: async (data: PlaybookFormData) => {
      // Upsert Playbook
      const { data: playbookResult, error: playbookError } = await supabase.from('playbooks').upsert({
        id: isEditMode ? playbook.id : undefined,
        name: data.name,
        nicho: data.nicho,
      }).select().single();
      if (playbookError) throw playbookError;

      // Sincronizar Etapas
      const stepIdsToKeep: string[] = [];
      for (const [index, stepData] of data.steps.entries()) {
        const { data: stepResult, error: stepError } = await supabase.from('playbook_steps').upsert({
          id: stepData.id,
          playbook_id: playbookResult.id,
          order: index,
          objective: stepData.objective,
          checklist: stepData.checklist,
          script: stepData.script,
          internal_notes: stepData.internal_notes,
        }).select().single();
        if (stepError) throw stepError;
        stepIdsToKeep.push(stepResult.id);
      }

      // Remover etapas que foram excluídas no formulário
      if (isEditMode) {
        const { error: deleteError } = await supabase.from('playbook_steps')
          .delete()
          .eq('playbook_id', playbookResult.id)
          .not('id', 'in', `(${stepIdsToKeep.join(',')})`);
        if (deleteError) throw deleteError;
      }
    },
    onSuccess: () => {
      showSuccess(`Playbook ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['playbooksWithSteps'] });
      onCancel();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: PlaybookFormData) => mutation.mutate(data);

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEditMode ? 'Editar Playbook' : 'Novo Playbook'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Playbook</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="nicho" render={({ field }) => (<FormItem><FormLabel>Nicho</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o nicho" /></SelectTrigger></FormControl><SelectContent>{NICHOS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <h3 className="text-xl font-semibold">Etapas do Playbook</h3>
          {fields.map((field, index) => (
            <Card key={field.id} className="bg-secondary/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Etapa {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(index, index - 1)} disabled={index === 0}><ArrowUp className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name={`steps.${index}.objective`} render={({ field }) => (<FormItem><FormLabel>Objetivo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`steps.${index}.script`} render={({ field }) => (<FormItem><FormLabel>Script</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`steps.${index}.internal_notes`} render={({ field }) => (<FormItem><FormLabel>Observações Internas</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <ChecklistField arrayName={`steps.${index}.checklist`} />
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ objective: '', checklist: [], script: '', internal_notes: '' })}><PlusCircle className="w-4 h-4 mr-2" />Adicionar Etapa</Button>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Playbook
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};

const ChecklistField = ({ arrayName }: { arrayName: `steps.${number}.checklist` }) => {
  const { control } = useForm<PlaybookFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: arrayName });

  return (
    <div className="space-y-2">
      <FormLabel>Checklist</FormLabel>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField control={control} name={`${arrayName}.${index}.text`} render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}><PlusCircle className="w-4 h-4 mr-2" />Adicionar item</Button>
    </div>
  );
};