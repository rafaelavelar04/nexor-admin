import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AuditLog } from './AuditLogTableColumns';
import JsonDiffViewer from './JsonDiffViewer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogDetailDialogProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LogDetailDialog = ({ log, isOpen, onClose }: LogDetailDialogProps) => {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
          <DialogDescription>
            Ação <span className="font-semibold text-primary">{log.action}</span> na entidade <span className="font-semibold text-primary">{log.entity}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Usuário:</strong> {log.user?.full_name || 'Sistema'}</div>
            <div><strong>Data:</strong> {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</div>
            <div><strong>Entidade:</strong> {log.entity}</div>
            <div><strong>ID da Entidade:</strong> {log.entity_id || 'N/A'}</div>
          </div>
          <JsonDiffViewer beforeData={log.before_data} afterData={log.after_data} />
        </div>
      </DialogContent>
    </Dialog>
  );
};