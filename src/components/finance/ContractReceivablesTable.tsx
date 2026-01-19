import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { isBefore, startOfToday } from 'date-fns';
import { DatePicker } from "../ui/date-picker";

type Receivable = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pendente' | 'pago' | 'atrasado';
  paid_at: string | null;
  installment_number: number | null;
};

interface ContractReceivablesTableProps {
  receivables: Receivable[];
  onMarkAsPaid: (id: string, isPaid: boolean) => void;
  isUpdatingStatus: boolean;
  onUpdateDueDate: (id: string, date: Date) => void;
  updatingReceivableId: string | null;
}

const statusConfig = {
  pago: { icon: <CheckCircle className="h-4 w-4 text-green-400" />, label: "Pago", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  pendente: { icon: <AlertCircle className="h-4 w-4 text-yellow-400" />, label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  atrasado: { icon: <XCircle className="h-4 w-4 text-red-400" />, label: "Atrasado", className: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export const ContractReceivablesTable = ({ receivables, onMarkAsPaid, isUpdatingStatus, onUpdateDueDate, updatingReceivableId }: ContractReceivablesTableProps) => {
  if (receivables.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela gerada para este contrato.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivables.sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0)).map(item => {
            const isOverdue = isBefore(new Date(item.due_date), startOfToday()) && item.status === 'pendente';
            const status = isOverdue ? 'atrasado' : item.status;
            const config = statusConfig[status];
            const isPaid = item.status === 'pago';
            const isUpdatingThisDate = updatingReceivableId === item.id;

            return (
              <TableRow key={item.id}>
                <TableCell><Badge className={config.className}>{config.icon}<span className="ml-2">{config.label}</span></Badge></TableCell>
                <TableCell>{item.installment_number || 'Única'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DatePicker
                      date={new Date(item.due_date)}
                      setDate={(date) => { if (date) onUpdateDueDate(item.id, date) }}
                      buttonClassName="h-8"
                      disabled={isUpdatingStatus || !!updatingReceivableId}
                    />
                    {isUpdatingThisDate && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant={isPaid ? "outline" : "default"} 
                    size="sm"
                    onClick={() => onMarkAsPaid(item.id, !isPaid)}
                    disabled={isUpdatingStatus || !!updatingReceivableId}
                  >
                    {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPaid ? 'Marcar como Pendente' : 'Marcar como Pago')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};