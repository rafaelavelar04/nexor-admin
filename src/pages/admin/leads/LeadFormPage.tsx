import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { leadSchema, LeadFormData } from '@/lib/validators/leadValidator';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, ArrowLeft } from 'lucide-react';

const statusOptions = [
  "Não contatado",
  "Primeiro contato feito",
  "Sem resposta",
  "Em conversa",
  "Follow-up agendado",
  "Não interessado",
];

interface UserProfile {
  id: string;
  full_name: string;
}

const LeadFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isEditMode = Boolean(id);

  const { data: leadData, isLoading: isLoadingLead } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserProfile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: '',
      empresa: '',
      nicho: '',
      responsavel_id: user?.id || '',
      status: 'Não contatado',
      cargo: '',
      email: '',
      whatsapp: '',
      observacoes: '',
      proximo_followup: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && leadData) {
      form.reset({
        ...leadData,
        proximo_followup: leadData.proximo_followup ? new Date(leadData.proximo_followup) : undefined,
      });
    } else if (!isEditMode && user) {
      form.setValue('responsavel_id', user.id);
    }
  }, [leadData, isEditMode, form, user]);

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const { data: result, error } = isEditMode
        ? await supabase.from('leads').update(data).eq('id', id).select().single()
        : await supabase.from('leads').insert(data).select().single();

      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      showSuccess(`Lead ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/admin/leads');
    },
    onError: (error) => {
      showError(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} lead: ${error.message}`);
    },
  });

  const onSubmit = (data: LeadFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingLead || isLoadingUsers) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/leads')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a lista de leads
      </Button>
      <h1 className="text-3xl font-bold text-white mb-6">{isEditMode ? 'Editar Lead' : 'Novo Lead'}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome do lead" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="empresa" render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl><Input placeholder="Empresa do lead" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nicho" render={({ field }) => (
              <FormItem>
                <FormLabel>Nicho</FormLabel>
                <FormControl><Input placeholder="Nicho de mercado" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cargo" render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl><Input placeholder="Cargo do lead" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="email@exemplo.com" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="whatsapp" render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl><Input placeholder="(99) 99999-9999" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="responsavel_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue placeholder="Selecione um status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="proximo_followup" render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-2">Próximo Follow-up</FormLabel>
                <DatePicker date={field.value} setDate={field.onChange} />
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="observacoes" render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Observações sobre o lead" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LeadFormPage;