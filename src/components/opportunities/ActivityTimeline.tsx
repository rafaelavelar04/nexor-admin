import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, MessageSquare, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

const activitySchema = z.object({
  type: z.string().min(1, "Selecione um tipo."),
  description: z.string().min(3, "A descrição é obrigatória."),
});
type ActivityFormData = z.infer<typeof activitySchema>;

const activityIcons = {
  'Email': <MessageSquare className="w-5 h-5" />,
  'Call': <Phone className="w-5 h-5" />,
  'Meeting': <Users className="w-5 h-5" />,
};

export const ActivityTimeline = ({ opportunityId, initialActivities, canEdit }: { opportunityId: string, initialActivities: any[], canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [activities, setActivities] = useState(initialActivities);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { type: '', description: '' },
  });

  const mutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const { error } = await supabase.from('activities').insert({
        ...data,
        opportunity_id: opportunityId,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Atividade adicionada!");
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
      form.reset();
    },
    onError: (error) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: ActivityFormData) => mutation.mutate(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">Atividades</CardTitle>
      </CardHeader>
      <CardContent>
        {canEdit && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Tipo de atividade" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Textarea placeholder="Descreva a atividade..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" disabled={mutation.isPending} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar Atividade
              </Button>
            </form>
          </Form>
        )}
        <div className="space-y-6">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-primary">
                    {activityIcons[activity.type as keyof typeof activityIcons] || <MessageSquare className="w-5 h-5" />}
                  </span>
                  <div className="flex-grow w-px bg-border"></div>
                </div>
                <div className="pb-6 w-full">
                  <p className="text-sm text-muted-foreground">
                    {activity.user?.full_name || 'Usuário'} • {format(new Date(activity.activity_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                  <p className="font-semibold text-foreground">{activity.type}</p>
                  <p className="text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};