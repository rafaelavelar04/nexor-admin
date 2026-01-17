import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WinLossConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  opportunityTitle: string;
  targetStageName: "Ganho" | "Perdido";
}

export const WinLossConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isConfirming,
  opportunityTitle,
  targetStageName,
}: WinLossConfirmationModalProps) => {
  const isWin = targetStageName === "Ganho";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Ação</DialogTitle>
          <DialogDescription>
            Você tem certeza que deseja mover a oportunidade "{opportunityTitle}" para a etapa de "{targetStageName}"?
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação irá {isWin ? "marcar a oportunidade como ganha" : "marcar a oportunidade como perdida"} e registrar a data de fechamento.
        </p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isConfirming}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={isWin ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            {isConfirming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};