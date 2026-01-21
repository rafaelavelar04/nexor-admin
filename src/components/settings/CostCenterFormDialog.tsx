import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const costCenterSchema = z.object({
  nome: z.string().min(3, "O nome é obrigatório."),
  descricao: z.string().optional(),
});

type CostCenterFormData = z.infer<typeof costCenterSchema>;
export type CostCenter = { id: string; nome: string; descricao: string | null; ativo: boolean };

interface CostCenterFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  costCenter?: CostCenter | null;
}

export const CostCenterFormDialog = ({ isOpen, onClose, costCenter }: CostCenterFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!costCenter;

  const form = useForm<CostCenterFormData>({
    resolver: zodResolver(costCenterSchema),
  });

  useEffect(() => {
    if (costCenter) {
      form.reset({ nome: costCenter.nome, descricao: costCenter.descricao || '' });
    } else {
      form.reset({ nome: '', descricao: '' });
    }
  }, [costCenter, form, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: CostCenterFormData) => {
      const { error } = isEditMode
        ? await supabase.from('cost_centers').update(data).eq('id', costCenter!.id)
        : await supabase.from('cost_centers').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Centro de Custo ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: CostCenterFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
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