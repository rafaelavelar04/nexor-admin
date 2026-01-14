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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const ticketSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  description: z.string().optional(),
  company_id: z.string().uuid("Selecione uma empresa.").optional().nullable(),
  owner_id: z.string().uuid("Selecione um responsável.").optional().nullable(),
  priority: z.string().min(1, "A prioridade é obrigatória."),
  status: z.string().min(1, "O status é obrigatório."),
});

type TicketFormData = z.infer<typeof ticketSchema>;
type Ticket = { id: string } & TicketFormData;

interface TicketFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
}

export const TicketFormDialog = ({ isOpen, onClose, ticket }: TicketFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!ticket;

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  useEffect(() => {
    if (ticket) {
      form.reset(ticket);
    } else {
      form.reset({
        title: '',
        description: '',
        company_id: null,
        owner_id: null,
        priority: 'media',
        status: 'aberto',
      });
    }
  }, [ticket, form, isOpen]);

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => {
    const { data, error } = await supabase.from('companies').select('id, nome');
    if (error) throw error;
    return data || [];
  }});

  const { data: users } = useQuery({ queryKey: ['profiles'], queryFn: async () => {
    const { data, error } = await supabase.from('profiles').select('id, full_name').eq('active', true);
    if (error) throw error;
    return data || [];
  }});

  const mutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const submissionData = {
        ...data,
        closed_at: ['resolvido', 'fechado'].includes(data.status) ? new Date().toISOString() : null,
      };
      const { error } = isEditMode
        ? await supabase.from('tickets').update(submissionData).eq('id', ticket.id)
        : await supabase.from('tickets').insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Ticket ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: TicketFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Ticket' : 'Novo Ticket'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Atualize os detalhes do ticket.' : 'Descreva o problema ou solicitação do cliente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input placeholder="Ex: Erro ao exportar relatório" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea placeholder="Detalhe o problema..." rows={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Atribuir a..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">Ninguém</SelectItem>
                      {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salvar Alterações' : 'Criar Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};