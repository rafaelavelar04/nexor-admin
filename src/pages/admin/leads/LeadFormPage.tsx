import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
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
import { MultiSelectCreatable, Selectable } from '@/components/ui/multi-select-creatable';
import { Combobox } from '@/components/ui/combobox';
import { PhoneInput } from '@/components/ui/phone-input';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { DecisoresFormSection } from '@/components/leads/DecisoresFormSection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusOptions = [
  "Não contatado", "Primeiro contato feito", "Sem resposta",
  "Em conversa", "Follow-up agendado", "Não interessado",
];

const NICHOS = [
  "Advocacia", "Agronegócio", "Agências de Marketing", "Alimentação / Restaurantes", "Arquitetura",
  "Clínicas Médicas", "Clínicas Odontológicas", "Comércio Atacadista", "Comércio Varejista",
  "Contabilidade", "Construtoras", "Educação / Cursos", "E-commerce", "Energia Solar",
  "Engenharia", "Estética", "Farmácias", "Fintechs", "Imobiliárias", "Indústrias",
  "Logística", "Marketing Digital", "Prestadores de Serviço", "SaaS", "Tecnologia da Informação",
  "Transportes", "Turismo", "Outros"
].sort();

const nichoOptions = NICHOS.map(n => ({ value: n, label: n }));

interface UserProfile { id: string; full_name: string; }
type Tag = { id: string; nome: string; cor: string | null; };

const LeadFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isEditMode = Boolean(id);

  const [selectedTags, setSelectedTags] = useState<Selectable[]>([]);

  const { data: leadData, isLoading: isLoadingLead, isError: isErrorLead } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('leads').select('*, tags(*), decisores(*)').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditMode,
  });

  const { data: users, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery<UserProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: allTags, isLoading: isLoadingTags, isError: isErrorTags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: '', empresa: '', nicho: '', responsavel_id: '', status: 'Não contatado',
      cargo: '', email: '', whatsapp: '', observacoes: '', telefone_empresa: '',
      instagram_empresa: '', site_empresa: '', decisores: [],
    },
  });

  useEffect(() => {
    if (isEditMode && leadData) {
      form.reset({
        ...leadData,
        proximo_followup: leadData.proximo_followup ? new Date(leadData.proximo_followup) : null,
        decisores: leadData.decisores || [],
      });
      setSelectedTags(leadData.tags || []);
    } else if (!isEditMode && user) {
      form.setValue('responsavel_id', user.id);
    }
  }, [leadData, isEditMode, form, user]);

  const mutation = useMutation({
    mutationFn: async (formData: LeadFormData) => {
      const { decisores, ...leadFields } = formData;
      
      const { data: leadResult, error: leadError } = isEditMode
        ? await supabase.from('leads').update(leadFields).eq('id', id).select().single()
        : await supabase.from('leads').insert(leadFields).select().single();
      if (leadError) throw leadError;
      const leadId = leadResult.id;

      const newTagNames = selectedTags.filter(t => !t.id).map(t => ({ nome: t.nome }));
      let newTags: Tag[] = [];
      if (newTagNames.length > 0) {
        const { data: insertedTags, error: tagError } = await supabase.from('tags').insert(newTagNames).select();
        if (tagError) throw tagError;
        newTags = insertedTags;
      }
      const allTagIds = [...selectedTags.filter(t => t.id).map(t => t.id!), ...newTags.map(t => t.id)];
      await supabase.from('lead_tags').delete().eq('lead_id', leadId);
      if (allTagIds.length > 0) {
        const relations = allTagIds.map(tag_id => ({ lead_id: leadId, tag_id }));
        const { error: relationError } = await supabase.from('lead_tags').insert(relations);
        if (relationError) throw relationError;
      }

      await supabase.from('decisores').delete().eq('lead_id', leadId);
      if (decisores && decisores.length > 0) {
        const decisoresToInsert = decisores.map(({ id: _decisorId, ...rest }) => ({ ...rest, lead_id: leadId }));
        const { error: decisoresError } = await supabase.from('decisores').insert(decisoresToInsert);
        if (decisoresError) throw decisoresError;
      }

      return leadResult;
    },
    onSuccess: () => {
      showSuccess(`Lead ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      navigate('/admin/leads');
    },
    onError: (error) => showError(`Erro ao salvar lead: ${error.message}`),
  });

  const onSubmit = (data: LeadFormData) => mutation.mutate(data);

  if (isLoadingLead || isLoadingUsers || isLoadingTags) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isErrorLead || isErrorUsers || isErrorTags) return <div className="text-destructive">Erro ao carregar dados.</div>;

  return (
    <FormProvider {...form}>
      <div>
        <Button variant="ghost" onClick={() => navigate('/admin/leads')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <h1 className="text-3xl font-bold text-white mb-6">{isEditMode ? 'Editar Lead' : 'Novo Lead'}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="cargo" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><FormControl><Input placeholder="Cargo do lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><PhoneInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <Card className="bg-secondary/50"><CardHeader><CardTitle className="text-lg">Dados da Empresa</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="empresa" render={({ field }) => (<FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Empresa do lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="nicho" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Nicho</FormLabel><Combobox options={nichoOptions} value={field.value} onChange={field.onChange} placeholder="Selecione um nicho" /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="site_empresa" render={({ field }) => (<FormItem><FormLabel>Site</FormLabel><FormControl><Input placeholder="https://empresa.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="telefone_empresa" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="Telefone da empresa" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="instagram_empresa" render={({ field }) => (<FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@empresa" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent></Card>

            <DecisoresFormSection />

            <Card className="bg-secondary/50"><CardHeader><CardTitle className="text-lg">Gestão Interna</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="responsavel_id" render={({ field }) => (<FormItem><FormLabel>Responsável</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um responsável" /></SelectTrigger></FormControl><SelectContent>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um status" /></SelectTrigger></FormControl><SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="proximo_followup" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel className="mb-2">Próximo Follow-up</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
            </CardContent></Card>

            <FormItem><FormLabel>Tags</FormLabel><MultiSelectCreatable options={allTags || []} selected={selectedTags} onChange={setSelectedTags} placeholder="Adicionar tags..." /></FormItem>
            <FormField control={form.control} name="observacoes" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre o lead" {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salvar Alterações' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </FormProvider>
  );
};

export default LeadFormPage;