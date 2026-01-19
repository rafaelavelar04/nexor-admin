import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWebhookLogsColumns, WebhookLog } from '@/components/settings/WebhookLogsTableColumns';
import { WebhookLogDetailDialog } from '@/components/settings/WebhookLogDetailDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

const WebhookLogsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const { data: webhook, isLoading: isLoadingWebhook } = useQuery({
    queryKey: ['webhook', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('webhooks').select('name').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery<WebhookLog[]>({
    queryKey: ['webhook_logs', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase.from('webhook_logs').select('*').eq('webhook_id', id).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const columns = getWebhookLogsColumns(log => setSelectedLog(log));
  const table = useReactTable({
    data: logs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isLoading = isLoadingWebhook || isLoadingLogs;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/settings?tab=webhooks')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Webhooks
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logs do Webhook</h1>
        <p className="text-muted-foreground mt-1">Exibindo as últimas 100 entregas para "{webhook?.name || '...'}"</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Evento</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto w-6 h-6 animate-spin" /></TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum log encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <WebhookLogDetailDialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
};

export default WebhookLogsPage;