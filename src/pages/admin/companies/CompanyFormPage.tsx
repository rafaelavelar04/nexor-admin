import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { companySchema, CompanyFormData } from '@/lib/validators/companyValidator';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';

const CompanyFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nome: '',
      segmento: '',
      site: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (isEditMode && companyData) {
      form.reset(companyData);
    }
  }, [companyData, isEditMode, form]);

  const mutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: result, error } = isEditMode
        ? await supabase.from('companies').update(data).eq('id', id).select().single()
        : await supabase.from('companies').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      showSuccess(`Empresa ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/admin/companies');
    },
    onError: (error) => {
      showError(`Erro ao salvar empresa: ${error.message}`);
    },
  });

  const onSubmit = (data: CompanyFormData) => mutation.mutate(data);

  if (isLoadingCompany) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/admin/companies')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold text-white mb-6">{isEditMode ? 'Editar Empresa' : 'Nova Empresa'}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome da empresa" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="segmento" render={({ field }) => (
              <FormItem>
                <FormLabel>Segmento</FormLabel>
                <FormControl><Input placeholder="Ex: Tecnologia, Varejo" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="site" render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl><Input placeholder="https://exemplo.com" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="observacoes" render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Observações sobre a empresa" {...field} className="bg-gray-800 border-gray-700" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CompanyFormPage;