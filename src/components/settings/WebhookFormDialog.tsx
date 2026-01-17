import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { WEBHOOK_EVENTS, ALL_EVENTS } from '@/lib/webhook-events';

const webhookSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  url: z.string().url("Por favor, insira uma URL válida."),
  events: z.array(z.string()).min(1, "Selecione pelo menos um evento."),
  secret: z.string().optional(),
  active: z.boolean(),
});

type WebhookFormData = z.infer<typeof webhookSchema>;
export type Webhook = { id: string } & WebhookFormData;

interface WebhookFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  webhook?: Webhook | null;
}

export const WebhookFormDialog = ({ isOpen, onClose, webhook }: WebhookFormDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!webhook;

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      secret: '',
      active: true,
    },
  });

  useEffect(() => {
    if (webhook) {
      form.reset(webhook);
    } else {
      form.reset({ name: '', url: '', events: [], secret: '', active: true });
    }
  }, [webhook, form, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const { error } = isEditMode
        ? await supabase.from('webhooks').update(data).eq('id', webhook!.id)
        : await supabase.from('webhooks').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Webhook ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      onClose();
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const onSubmit = (data: WebhookFormData) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          <DialogDescription>Configure um endpoint para receber eventos do sistema.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Integração Slack" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="url" render={({ field }) => (
              <FormItem><FormLabel>URL do Endpoint</FormLabel><FormControl><Input placeholder="https://seu-servico.com/webhook" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="secret" render={({ field }) => (
              <FormItem><FormLabel>Segredo (Opcional)</FormLabel><FormControl><Input placeholder="Token secreto para verificação" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="events" render={({ field }) => (
              <FormItem>
                <FormLabel>Eventos</FormLabel>
                <Accordion type="multiple" className="w-full border rounded-md px-3">
                  {Object.entries(WEBHOOK_EVENTS).map(([category, events]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger>{category}</AccordionTrigger>
                      <AccordionContent className="grid grid-cols-2 gap-2">
                        {events.map(event => (
                          <FormField key={event.id} control={form.control} name="events" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event.id])
                                      : field.onChange(field.value?.filter(value => value !== event.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{event.name}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>Ativo</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditMode ? 'Salvar Alterações' : 'Criar Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};