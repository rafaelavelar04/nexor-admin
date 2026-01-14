import { useEffect, useState } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { Contract } from './ContractsTableColumns';

const contractSchema = z.object({
  company_id: z.string().uuid("Selecione uma empresa."),
  opportunity_id: z.string().uuid("Selecione uma oportunidade.").optional().nullable(),
  type: z.enum(['recorrente', 'pontual']),
  value: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9,]/g, "").replace(",", ".")),
    z.number().positive({ message: "O valor deve ser positivo." })
  ),
  billing_cycle: z.enum(['mensal', 'anual']).optional().nullable(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']),
  start_date: z.date({ required_error: "A data de início é obrigatória." }),
  end_date: z.date().optional().nullable(),
}).refine(data => data.type === 'pontual' || !!data.billing_cycle, {
  message: "O ciclo de faturamento é obrigatório para contratos recorrentes.",
  path: ["billing_cycle"],
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: Contract | null;
}

export const ContractFormDialog = ({ isOpen, onClose, contract }: ContractFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!contract;
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(undefined);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
  });

  const contractType = form.watch('type');

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        form.reset({
          ...contract,
          start_date: new Date(contract.start_date),
          end_date: contract.end_date ? new Date(contract.end_date) : null,
        });
        setSelectedCompany(contract.company_id);
      } else {
        form.reset({
          type: 'recorrente',
          status: 'ativo',
          start_date: new Date(),
        });
        setSelectedCompany(undefined);
      }
    }
  }, [contract, form, isOpen]);

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => {
    const { data, error } = await supabase.from('companies').select('id, nome');
    if (error) throw error;
    return data || [];
  }});

  const { data: opportunities } = useQuery({
    queryKey: ['wonOpportunities', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase.from('opportunities')
        .select('id, titulo, lead:leads!inner(company_id)')
        .eq('status', 'won')
        .eq('lead.company_id', selectedCompany);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompany,
  });

  const mutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const { error } = isEditMode
        ? await supabase.from('contracts').update(data).eq('id', contract!.id)
        : await supabase.from('contracts').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Contrato ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: ContractFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); setSelectedCompany(value); }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
                    <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="opportunity_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Oportunidade (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedCompany || opportunities?.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Vincular oportunidade" /></SelectTrigger></FormControl>
                    <SelectContent>{opportunities?.map(o => <SelectItem key={o.id} value={o.id}>{o.titulo}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="recorrente">Recorrente</SelectItem>
                      <SelectItem value="pontual">Pontual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {contractType === 'recorrente' && (
                <FormField control={form.control} name="billing_cycle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Ex: Mensal" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="value" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="R$ 1000,00" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="mb-2">Data de Início</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="mb-2">Data de Fim (Opcional)</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salvar Alterações' : 'Criar Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};