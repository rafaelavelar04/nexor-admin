import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, Webhook as WebhookIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Webhook, WebhookFormDialog } from './WebhookFormDialog';
import { showSuccess, showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';

const WebhookSettings = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const { data: webhooks, isLoading, isError } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('webhooks').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('webhooks').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status do webhook atualizado.");
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Webhook excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este webhook?")) {
      deleteMutation.mutate(id);
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (isError) return <div className="text-destructive">Erro ao carregar webhooks.</div>;
    if (!webhooks || webhooks.length === 0) {
      return (
        <EmptyState
          icon={<WebhookIcon className="w-12 h-12" />}
          title="Nenhum webhook configurado"
          description="Crie seu primeiro webhook para integrar o Nexor com outros sistemas."
          cta={{ text: "Criar Webhook", onClick: () => setIsFormOpen(true) }}
        />
      );
    }
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map(webhook => (
              <TableRow key={webhook.id}>
                <TableCell className="font-medium">{webhook.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{webhook.url}</TableCell>
                <TableCell><Badge variant="secondary">{webhook.events.length}</Badge></TableCell>
                <TableCell>
                  <Switch
                    checked={webhook.active}
                    onCheckedChange={(active) => updateMutation.mutate({ id: webhook.id, active })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(webhook)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/webhooks/${webhook.id}/logs`)}>Ver Logs</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(webhook.id)} className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Envie eventos do sistema para endpoints externos.</CardDescription>
            </div>
            <Button onClick={() => { setSelectedWebhook(null); setIsFormOpen(true); }}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      <WebhookFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        webhook={selectedWebhook}
      />
    </>
  );
};

export default WebhookSettings;