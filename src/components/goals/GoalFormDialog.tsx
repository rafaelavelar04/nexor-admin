import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const goalSchema = z.object({
  valor: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9]/g, "")),
    z.number().positive({ message: "O valor da meta deve ser positivo." })
  ),
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(new Date().getFullYear() - 5).max(new Date().getFullYear() + 5),
  responsavel_id: z.string().uuid().nullable(),
});

type GoalFormData = z.infer<typeof goalSchema>;
type UserProfile = { id: string; full_name: string; };

export const GoalFormDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      valor: 0,
      mes: new Date().getMonth() + 1,
      ano: currentYear,
      responsavel_id: null,
    },
  });

  const { data: users } = useQuery<UserProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const { error } = await supabase.from('goals').insert(data);
      if (error) {
        if (error.code === '23505') throw new Error("Já existe uma meta para este período e responsável.");
        throw error;
      }
    },
    onSuccess: () => {
      showSuccess('Meta criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['goalsAndPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: GoalFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Criar Nova Meta</DialogTitle>
          <DialogDescription>Defina um objetivo de valor em oportunidades ganhas para um período.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="valor" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Meta</FormLabel>
                <FormControl><Input type="number" placeholder="R$ 50000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="mes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ano" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="responsavel_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Meta Global" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">Meta Global</SelectItem>
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
                Criar Meta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};