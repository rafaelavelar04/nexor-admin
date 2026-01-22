import { Button } from "@/components/ui/button";
import { Download, Trash2, Tag, User, Activity, Calendar as CalendarIcon } from "lucide-react";
import { BulkActionType } from "./BulkActionDialog";

interface BulkActionBarProps {
  selectedCount: number;
  onTriggerAction: (action: BulkActionType) => void;
  onExport: () => void;
  onDelete: () => void;
}

export const BulkActionBar = ({
  selectedCount,
  onTriggerAction,
  onExport,
  onDelete,
}: BulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="font-semibold">{selectedCount} lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onTriggerAction('change_status')}><Activity className="w-4 h-4 mr-2" /> Alterar Status</Button>
          <Button variant="outline" onClick={() => onTriggerAction('assign_owner')}><User className="w-4 h-4 mr-2" /> Atribuir Responsável</Button>
          <Button variant="outline" onClick={() => onTriggerAction('change_niche')}><Tag className="w-4 h-4 mr-2" /> Alterar Nicho</Button>
          <Button variant="outline" onClick={() => onTriggerAction('set_followup')}><CalendarIcon className="w-4 h-4 mr-2" /> Definir Follow-up</Button>
          <Button variant="outline" onClick={onExport}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          <Button variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
        </div>
      </div>
    </div>
  );
};