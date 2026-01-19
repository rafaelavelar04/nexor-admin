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
import { CurrencyInput } from '@/components/ui/currency-input';
import { addMonths } from 'date-fns';

const contractSchema = z.object({
  company_id: z.string().uuid("Selecione uma empresa."),
  opportunity_id: z.string().uuid("Selecione uma oportunidade.").optional().nullable(),
  type: z.enum(['recorrente', 'pontual']),
  value: z.number().positive({ message: "O valor deve ser positivo." }),
  billing_cycle: z.enum(['mensal', 'anual']).optional().nullable(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']),
  start_date: z.date({ required_error: "A data de início é obrigatória." }),
  end_date: z.date().optional().nullable(),
  tipo_pagamento: z.enum(['pagamento_unico', 'parcelado', 'recorrente']),
  numero_parcelas: z.coerce.number().int().positive().optional().nullable(),
}).refine(data => data.type === 'pontual' || !!data.billing_cycle, {
  message: "O ciclo de faturamento é obrigatório para contratos recorrentes.",
  path: ["billing_cycle"],
}).refine(data => data.tipo_pagamento !== 'parcelado' || (data.numero_parcelas && data.numero_parcelas > 0), {
    message: "O número de parcelas é obrigatório para pagamento parcelado.",
    path: ["numero_parcelas"],
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
  const paymentType = form.watch('tipo_pagamento');

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        form.reset({
          ...contract,
          start_date: new Date(contract.start_date),
          end_date: contract.end_date ? new Date(contract.end_date) : null,
          tipo_pagamento: contract.tipo_pagamento || 'pagamento_unico',
        });
        setSelectedCompany(contract.company_id);
      } else {
        form.reset({
          type: 'recorrente',
          status: 'ativo',
          start_date: new Date(),
          tipo_pagamento: 'recorrente',
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
      // 1. Upsert contract
      const { data: contractResult, error: contractError } = isEditMode
        ? await supabase.from('contracts').update(data).eq('id', contract!.id).select().single()
        : await supabase.from('contracts').insert(data).select().single();
      if (contractError) throw contractError;

      const contractId = contractResult.id;

      // 2. Delete old receivables to regenerate them
      const { error: deleteError } = await supabase.from('receivables').delete().eq('contract_id', contractId);
      if (deleteError) throw deleteError;

      // 3. Generate new receivables based on payment type
      const newReceivables: Omit<any, 'id' | 'created_at'>[] = [];
      if (data.tipo_pagamento === 'pagamento_unico') {
        newReceivables.push({
          contract_id: contractId,
          due_date: data.start_date.toISOString().split('T')[0],
          amount: data.value,
          status: 'pendente',
          installment_number: 1,
        });
      } else if (data.tipo_pagamento === 'parcelado' && data.numero_parcelas && data.numero_parcelas > 0) {
        const installmentValue = data.value / data.numero_parcelas;
        for (let i = 0; i < data.numero_parcelas; i++) {
          newReceivables.push({
            contract_id: contractId,
            due_date: addMonths(data.start_date, i).toISOString().split('T')[0],
            amount: installmentValue,
            status: 'pendente',
            installment_number: i + 1,
          });
        }
      }
      // Note: 'recorrente' logic will be handled by a separate process or future feature.

      // 4. Insert new receivables
      if (newReceivables.length > 0) {
        const { error: insertError } = await supabase.from('receivables').insert(newReceivables);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      showSuccess(`Contrato ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
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
                  <FormLabel>Tipo de Contrato</FormLabel>
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
                    <FormLabel>Ciclo de Faturamento</FormLabel>
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
                <FormLabel>Valor Total</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="tipo_pagamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pagamento_unico">Pagamento Único</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                      <SelectItem value="recorrente">Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {paymentType === 'parcelado' && (
                <FormField control={form.control} name="numero_parcelas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Parcelas</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className="mb-2">Data de Início / 1º Vencimento</FormLabel>
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
                <FormLabel>Status do Contrato</FormLabel>
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