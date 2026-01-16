import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Loader2, ArrowLeft } from 'lucide-react';

const ticketSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  description: z.string().optional(),
  company_id: z.string().uuid("Selecione uma empresa.").optional().nullable(),
  owner_id: z.string().uuid("Selecione um responsável.").optional().nullable(),
  priority: z.string().min(1, "A prioridade é obrigatória."),
  status: z.string().min(1, "O status é obrigatório."),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const TicketFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: ticketData, isLoading: isLoadingTicket } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

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

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  useEffect(() => {
    if (isEditMode && ticketData) {
      form.reset(ticketData);
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
  }, [ticketData, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const submissionData = {
        ...data,
        closed_at: ['resolvido', 'fechado'].includes(data.status) ? new Date().toISOString() : null,
      };
      const { error } = isEditMode
        ? await supabase.from('tickets').update(submissionData).eq('id', id)
        : await supabase.from('tickets').insert(submissionData);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Ticket ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/admin/suporte');
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: TicketFormData) => mutation.mutate(data);

  if (isLoadingTicket) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/suporte')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold text-white mb-6">{isEditMode ? 'Editar Ticket' : 'Novo Ticket de Suporte'}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Ticket'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TicketFormPage;