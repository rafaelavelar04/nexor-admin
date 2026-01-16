import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { CurrencyInput } from '@/components/ui/currency-input';

const opportunitySchema = z.object({
  titulo: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  valor_estimado: z.number().positive({ message: "O valor deve ser positivo." }).optional().nullable(),
  responsavel_id: z.string().uuid({ message: "Selecione um responsável." }),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;
interface UserProfile { id: string; full_name: string; }

interface ConvertLeadModalProps {
  leadId: string | null;
  leadName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ConvertLeadModal = ({ leadId, leadName, isOpen, onClose }: ConvertLeadModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      titulo: '',
      valor_estimado: null,
      responsavel_id: user?.id || '',
    },
  });

  useEffect(() => {
    if (leadName) {
      form.setValue('titulo', `Oportunidade - ${leadName}`);
    }
    if (user) {
      form.setValue('responsavel_id', user.id);
    }
  }, [leadName, user, form]);

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: OpportunityFormData) => {
      if (!leadId) throw new Error("Lead ID não encontrado.");

      // 1. Check for existing active opportunity
      const { data: existingOpp, error: checkError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('lead_id', leadId)
        .eq('status', 'open')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }
      if (existingOpp) {
        throw new Error("Este lead já possui uma oportunidade ativa.");
      }

      // 2. Get the first pipeline stage
      const { data: firstStage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id')
        .order('ordem', { ascending: true })
        .limit(1)
        .single();
      
      if (stageError || !firstStage) {
        throw new Error("Não foi possível encontrar a etapa inicial do pipeline.");
      }

      // 3. Create the opportunity
      const { error: insertError } = await supabase.from('opportunities').insert({
        ...data,
        lead_id: leadId,
        pipeline_stage_id: firstStage.id,
        status: 'open',
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      showSuccess('Lead convertido em oportunidade com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // To potentially update lead status in the future
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      showError(`Erro ao converter lead: ${error.message}`);
    },
  });

  const onSubmit = (data: OpportunityFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Converter Lead em Oportunidade</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie uma nova oportunidade para o lead "{leadName}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="titulo" render={({ field }) => (
              <FormItem>
                <FormLabel>Título da Oportunidade</FormLabel>
                <FormControl><Input {...field} className="bg-gray-700 border-gray-600" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="valor_estimado" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Estimado (opcional)</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="responsavel_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingUsers}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600"><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Converter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};