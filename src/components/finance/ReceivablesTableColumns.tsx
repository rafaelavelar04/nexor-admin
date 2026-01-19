import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { isBefore, startOfToday } from 'date-fns';

export type Receivable = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pendente' | 'pago' | 'atrasado';
  paid_at: string | null;
  installment_number: number | null;
  contract: {
    id: string;
    tipo_pagamento: string;
    numero_parcelas: number | null;
    company: {
      nome: string;
    } | null;
  };
};

const statusConfig = {
  pago: { icon: <CheckCircle className="h-4 w-4 text-green-400" />, label: "Pago", className: "bg-green-500/20 text-green-300 border-green-500/30" },
  pendente: { icon: <AlertCircle className="h-4 w-4 text-yellow-400" />, label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  atrasado: { icon: <XCircle className="h-4 w-4 text-red-400" />, label: "Atrasado", className: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export const getReceivablesColumns = (onMarkAsPaid: (id: string, isPaid: boolean) => void): ColumnDef<Receivable>[] => [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status];
      return (
        <Badge className={config.className}>
          {config.icon}
          <span className="ml-2">{config.label}</span>
        </Badge>
      );
    },
  },
  {
    id: "empresa",
    header: "Empresa",
    accessorFn: row => row.contract.company?.nome,
  },
  {
    accessorKey: "installment_number",
    header: "Parcela",
    cell: ({ row }) => {
      const { installment_number, contract } = row.original;
      if (contract?.tipo_pagamento === 'parcelado' && installment_number && contract.numero_parcelas) {
        return `${installment_number} / ${contract.numero_parcelas}`;
      }
      if (contract?.tipo_pagamento === 'pagamento_unico') {
        return 'Única';
      }
      return 'N/A';
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Valor <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "due_date",
    header: "Vencimento",
    cell: ({ row }) => format(new Date(row.original.due_date), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    id: "tipo_pagamento",
    header: "Tipo",
    accessorFn: row => row.contract.tipo_pagamento,
    cell: ({ row }) => <span className="capitalize">{row.original.contract.tipo_pagamento?.replace('_', ' ') || 'N/A'}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const isPaid = row.original.status === 'pago';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMarkAsPaid(row.original.id, !isPaid)}>
              {isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];