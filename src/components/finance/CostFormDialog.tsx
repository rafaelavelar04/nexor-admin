import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CurrencyInput } from '../ui/currency-input';

const costSchema = z.object({
  partner_id: z.string().uuid("Selecione um parceiro."),
  valor: z.number().positive("O valor deve ser positivo."),
  status: z.enum(['previsto', 'pago']),
  centro_custo: z.string().min(3, "O centro de custo é obrigatório."),
  observacao: z.string().optional(),
});

type CostFormData = z.infer<typeof costSchema>;
export type Cost = { id: string } & CostFormData;

interface CostFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  cost?: Cost | null;
}

export const CostFormDialog = ({ isOpen, onClose, contractId, cost }: CostFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!cost;

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: { status: 'previsto' },
  });

  useEffect(() => {
    if (cost) {
      form.reset(cost);
    } else {
      form.reset({ partner_id: '', valor: undefined, status: 'previsto', centro_custo: '', observacao: '' });
    }
  }, [cost, form, isOpen]);

  const { data: partners } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('id, nome').eq('ativo', true);
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      const submissionData = { ...data, contract_id: contractId };
      const { error } = isEditMode
        ? await supabase.from('partner_costs').update(submissionData).eq('id', cost!.id)
        : await supabase.from('partner_costs').insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Custo ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['contractCosts', contractId] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: CostFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Custo' : 'Adicionar Custo ao Contrato'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="partner_id" render={({ field }) => (
              <FormItem><FormLabel>Parceiro</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger></FormControl><SelectContent>{partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="valor" render={({ field }) => (
              <FormItem><FormLabel>Valor</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="centro_custo" render={({ field }) => (
              <FormItem><FormLabel>Centro de Custo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="previsto">Previsto</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="observacao" render={({ field }) => (
              <FormItem><FormLabel>Observação</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};