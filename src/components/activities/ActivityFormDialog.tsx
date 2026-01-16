import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { Activity } from './ActivitiesTableColumns';
import { RelatedEntitySearch } from './RelatedEntitySearch';

const activitySchema = z.object({
  type: z.string().min(1, "O tipo é obrigatório."),
  description: z.string().min(3, "A descrição é obrigatória."),
  activity_date: z.date({ required_error: "A data da atividade é obrigatória." }),
  user_id: z.string().uuid("Selecione um responsável."),
  proximo_followup: z.date().optional().nullable(),
  related_entity: z.object({
    type: z.enum(['lead', 'opportunity', 'company']),
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
});
type ActivityFormData = z.infer<typeof activitySchema>;
type UserProfile = { id: string; full_name: string; };

interface ActivityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
}

export const ActivityFormDialog = ({ isOpen, onClose, activity }: ActivityFormDialogProps) => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isEditMode = !!activity;

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: '',
      description: '',
      activity_date: new Date(),
      user_id: user?.id,
      proximo_followup: null,
      related_entity: null,
    },
  });

  useEffect(() => {
    if (activity) {
      let related_entity = null;
      if (activity.lead) related_entity = { type: 'lead', id: activity.lead.id, name: activity.lead.nome };
      else if (activity.opportunity) related_entity = { type: 'opportunity', id: activity.opportunity.id, name: activity.opportunity.titulo };
      else if (activity.company) related_entity = { type: 'company', id: activity.company.id, name: activity.company.nome };

      form.reset({
        type: activity.type,
        description: activity.description,
        activity_date: new Date(activity.activity_date),
        user_id: activity.user?.id,
        proximo_followup: activity.proximo_followup ? new Date(activity.proximo_followup) : null,
        related_entity,
      });
    } else {
      form.reset({
        type: '',
        description: '',
        activity_date: new Date(),
        user_id: user?.id,
        proximo_followup: null,
        related_entity: null,
      });
    }
  }, [activity, user, form, isOpen]);

  const { data: users } = useQuery<UserProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const submissionData = {
        type: data.type,
        description: data.description,
        activity_date: data.activity_date.toISOString(),
        user_id: data.user_id,
        proximo_followup: data.proximo_followup?.toISOString().split('T')[0],
        lead_id: data.related_entity?.type === 'lead' ? data.related_entity.id : null,
        opportunity_id: data.related_entity?.type === 'opportunity' ? data.related_entity.id : null,
        company_id: data.related_entity?.type === 'company' ? data.related_entity.id : null,
      };

      const { error } = isEditMode
        ? await supabase.from('activities').update(submissionData).eq('id', activity!.id)
        : await supabase.from('activities').insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Atividade ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: ActivityFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          <DialogDescription>Registre uma nova interação ou evento.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="user_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea placeholder="Descreva a atividade..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="activity_date" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="mb-2">Data da Atividade</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="proximo_followup" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="mb-2">Próximo Follow-up (Opcional)</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="related_entity" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Vincular a (Opcional)</FormLabel>
                <RelatedEntitySearch value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};