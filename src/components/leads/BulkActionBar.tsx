import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, Tag, User, Activity } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onStatusChange: (status: string) => void;
  onOwnerChange: (ownerId: string) => void;
  onAddTags: () => void;
  onRemoveTags: () => void;
  onExport: () => void;
  onDelete: () => void;
  statusOptions: string[];
  users: { id: string; full_name: string }[];
}

export const BulkActionBar = ({
  selectedCount,
  onStatusChange,
  onOwnerChange,
  onAddTags,
  onRemoveTags,
  onExport,
  onDelete,
  statusOptions,
  users,
}: BulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="font-semibold">{selectedCount} lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]"><Activity className="w-4 h-4 mr-2" /> Alterar Status</SelectTrigger>
            <SelectContent>
              {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={onOwnerChange}>
            <SelectTrigger className="w-[180px]"><User className="w-4 h-4 mr-2" /> Atribuir Responsável</SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onAddTags}><Tag className="w-4 h-4 mr-2" /> Adicionar Tags</Button>
          <Button variant="outline" onClick={onRemoveTags}><Tag className="w-4 h-4 mr-2" /> Remover Tags</Button>
          <Button variant="outline" onClick={onExport}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          <Button variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
        </div>
      </div>
    </div>
  );
};