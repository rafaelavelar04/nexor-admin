import { useEffect } from 'react';
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
import { CurrencyInput } from '@/components/ui/currency-input';
import { Assignment } from './AssignmentsTableColumns';

const assignmentSchema = z.object({
  partner_id: z.string().uuid("Selecione um parceiro."),
  contract_id: z.string().uuid("Selecione um contrato."),
  service_name: z.string().min(3, "O nome do serviço é obrigatório."),
  valor_combinado: z.number().positive("O valor deve ser positivo."),
  status: z.enum(['em_execucao', 'finalizado', 'cancelado']),
  responsavel_id: z.string().uuid("Selecione um responsável."),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
}

export const AssignmentFormDialog = ({ isOpen, onClose, assignment }: AssignmentFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!assignment;

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        form.reset({
          ...assignment,
          start_date: assignment.start_date ? new Date(assignment.start_date) : null,
          end_date: assignment.end_date ? new Date(assignment.end_date) : null,
        });
      } else {
        form.reset({
          partner_id: '',
          contract_id: '',
          service_name: '',
          valor_combinado: undefined,
          status: 'em_execucao',
          responsavel_id: '',
          start_date: new Date(),
          end_date: null,
        });
      }
    }
  }, [assignment, form, isOpen]);

  const { data: partners } = useQuery({ queryKey: ['partners'], queryFn: async () => (await supabase.from('partners').select('id, nome')).data });
  const { data: contracts } = useQuery({ queryKey: ['contracts'], queryFn: async () => (await supabase.from('contracts').select('id, company:companies(nome)')).data });
  const { data: users } = useQuery({ queryKey: ['profiles'], queryFn: async () => (await supabase.from('profiles').select('id, full_name')).data });

  const mutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const submissionData = {
        ...data,
        start_date: data.start_date ? data.start_date.toISOString().split('T')[0] : null,
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
      };
      const { error } = isEditMode
        ? await supabase.from('partner_assignments').update(submissionData).eq('id', assignment!.id)
        : await supabase.from('partner_assignments').insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Alocação ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: AssignmentFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Alocação' : 'Nova Alocação'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="partner_id" render={({ field }) => (<FormItem><FormLabel>Parceiro</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contract_id" render={({ field }) => (<FormItem><FormLabel>Contrato</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{contracts?.map(c => <SelectItem key={c.id} value={c.id}>{c.company?.nome}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="service_name" render={({ field }) => (<FormItem><FormLabel>Serviço/Papel</FormLabel><FormControl><Input placeholder="Ex: Designer, Desenvolvedor" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="valor_combinado" render={({ field }) => (<FormItem><FormLabel>Valor Combinado</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel className="mb-2">Data de Início</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel className="mb-2">Data de Fim (Opcional)</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="em_execucao">Em Execução</SelectItem><SelectItem value="finalizado">Finalizado</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="responsavel_id" render={({ field }) => (<FormItem><FormLabel>Responsável Interno</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
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