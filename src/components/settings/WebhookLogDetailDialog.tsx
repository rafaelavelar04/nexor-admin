import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookLog } from './WebhookLogsTableColumns';

const JsonViewer = ({ title, data }: { title: string; data: any }) => {
  let content;
  if (data === null || data === undefined) {
    content = <p className="text-muted-foreground">N/A</p>;
  } else {
    try {
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      content = <pre className="whitespace-pre-wrap break-all text-sm">{JSON.stringify(jsonData, null, 2)}</pre>;
    } catch (e) {
      content = <pre className="whitespace-pre-wrap break-all text-sm text-destructive">{String(data)}</pre>;
    }
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="font-mono bg-secondary/50 p-4 rounded-md max-h-60 overflow-y-auto">
        {content}
      </CardContent>
    </Card>
  );
};

interface WebhookLogDetailDialogProps {
  log: WebhookLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookLogDetailDialog = ({ log, isOpen, onClose }: WebhookLogDetailDialogProps) => {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega do Webhook</DialogTitle>
          <DialogDescription>
            Evento: {log.event} | Status: {log.status_code} ({log.success ? 'Sucesso' : 'Falha'})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <JsonViewer title="Payload Enviado" data={log.payload} />
          <JsonViewer title="Resposta Recebida" data={log.response} />
        </div>
      </DialogContent>
    </Dialog>
  );
};