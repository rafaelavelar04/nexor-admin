import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { showError } from '@/utils/toast';

export type BulkActionType = 'assign_owner' | 'change_status' | 'change_niche' | 'set_followup';

interface BulkActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: BulkActionType | null;
  leadCount: number;
  onConfirm: (value: any) => void;
  users?: { id: string; full_name: string }[];
  statusOptions?: string[];
  nichoOptions?: { value: string; label: string }[];
}

export const BulkActionDialog = ({ isOpen, onClose, actionType, leadCount, onConfirm, users, statusOptions, nichoOptions }: BulkActionDialogProps) => {
  const [selectedValue, setSelectedValue] = useState<any>(null);

  const titles: Record<BulkActionType, string> = {
    assign_owner: 'Atribuir Responsável em Massa',
    change_status: 'Alterar Status em Massa',
    change_niche: 'Alterar Nicho em Massa',
    set_followup: 'Definir Próximo Follow-up em Massa',
  };

  const renderInput = () => {
    switch (actionType) {
      case 'assign_owner':
        return (
          <Select onValueChange={setSelectedValue}>
            <SelectTrigger><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
            <SelectContent>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
          </Select>
        );
      case 'change_status':
        return (
          <Select onValueChange={setSelectedValue}>
            <SelectTrigger><SelectValue placeholder="Selecione um status" /></SelectTrigger>
            <SelectContent>{statusOptions?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        );
      case 'change_niche':
        return <Combobox options={nichoOptions || []} value={selectedValue || ''} onChange={setSelectedValue} allowCreation placeholder="Selecione ou crie um nicho" />;
      case 'set_followup':
        return <DatePicker date={selectedValue} setDate={setSelectedValue} />;
      default:
        return null;
    }
  };

  const handleConfirm = () => {
    if (selectedValue) {
      onConfirm(selectedValue);
    } else {
      showError("Por favor, selecione um valor.");
    }
  };

  if (!actionType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[actionType]}</DialogTitle>
          <DialogDescription>
            Você está prestes a alterar {leadCount} leads. Selecione o novo valor abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderInput()}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Alteração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};