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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const partnerSchema = z.object({
  nome: z.string().min(3, "O nome é obrigatório."),
  razao_social: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  area: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
  observacoes: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

const PartnerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: partnerData, isLoading: isLoadingPartner } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('partners').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { status: 'ativo' },
  });

  useEffect(() => {
    if (isEditMode && partnerData) {
      form.reset(partnerData);
    }
  }, [partnerData, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const { error } = isEditMode
        ? await supabase.from('partners').update(data).eq('id', id)
        : await supabase.from('partners').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Parceiro ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      navigate('/admin/parceiros');
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: PartnerFormData) => mutation.mutate(data);

  if (isLoadingPartner) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/parceiros')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Editar Parceiro' : 'Novo Parceiro'}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do parceiro" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="razao_social" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Razão Social (se aplicável)" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="documento" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input placeholder="Documento" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contato@parceiro.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Área</FormLabel><FormControl><Input placeholder="Ex: Desenvolvimento, Design" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="observacoes" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Informações adicionais sobre o parceiro" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Parceiro'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PartnerFormPage;