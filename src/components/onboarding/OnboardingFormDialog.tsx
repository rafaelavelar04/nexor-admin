import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const onboardingSchema = z.object({
  company_id: z.string().uuid("Selecione uma empresa."),
  contract_id: z.string().uuid("Selecione um contrato.").optional().nullable(),
  owner_id: z.string().uuid("Selecione um responsável."),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const DEFAULT_ONBOARDING_STEPS = [
  "Reunião de Kick-off",
  "Definição de Metas e KPIs",
  "Configuração da Conta",
  "Treinamento da Equipe",
  "Primeira Revisão de Resultados",
  "Go-live",
];

interface OnboardingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingFormDialog = ({ isOpen, onClose }: OnboardingFormDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, nome');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboardings')
        .insert(data)
        .select()
        .single();
      if (onboardingError) throw onboardingError;

      const stepsToInsert = DEFAULT_ONBOARDING_STEPS.map((title, index) => ({
        onboarding_id: onboardingData.id,
        title,
        order_index: index,
      }));

      const { error: stepsError } = await supabase.from('onboarding_steps').insert(stepsToInsert);
      if (stepsError) throw stepsError;
    },
    onSuccess: () => {
      showSuccess('Onboarding iniciado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['onboardings'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: OnboardingFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Novo Onboarding</DialogTitle>
          <DialogDescription>Selecione a empresa e o responsável para iniciar o processo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="company_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="owner_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Iniciar Onboarding
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};