import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";

export type Contract = {
  id: string;
  company_id: string;
  opportunity_id: string | null;
  type: 'recorrente' | 'pontual';
  value: number;
  billing_cycle: 'mensal' | 'anual' | null;
  status: 'ativo' | 'pausado' | 'cancelado' | 'finalizado';
  start_date: string;
  end_date: string | null;
  tipo_pagamento: 'pagamento_unico' | 'parcelado' | 'recorrente';
  numero_parcelas: number | null;
  company: { nome: string } | null;
  opportunity: { titulo: string } | null;
  financial_status: 'previsto' | 'aprovado' | 'pago' | 'atrasado' | 'cancelado';
  due_date: string | null;
  paid_at: string | null;
};

const statusStyles: Record<Contract['status'], string> = {
  ativo: "bg-green-500/20 text-green-300 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
  finalizado: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const financialStatusStyles: Record<Contract['financial_status'], string> = {
  previsto: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  aprovado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pago: "bg-green-500/20 text-green-300 border-green-500/30",
  atrasado: "bg-red-500/20 text-red-300 border-red-500/30",
  cancelado: "bg-zinc-700/50 text-zinc-400 border-zinc-700",
};

export const getColumns = (onEdit: (contract: Contract) => void): ColumnDef<Contract>[] => [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.status === 'ativo' && <span className="h-2 w-2 rounded-full bg-green-500" />}
        <Badge className={`capitalize ${statusStyles[row.original.status]}`}>
          {row.original.status}
        </Badge>
      </div>
    ),
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "financial_status",
    header: "Status Financeiro",
    cell: ({ row }) => (
      <Badge className={`capitalize ${financialStatusStyles[row.original.financial_status]}`}>
        {row.original.financial_status.replace('_', ' ')}
      </Badge>
    ),
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "company",
    header: "Empresa",
    cell: ({ row }) => row.original.company?.nome || "N/A",
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Valor <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { value, billing_cycle } = row.original;
      const formattedValue = formatCurrency(value);
      const cycleText = billing_cycle === 'mensal' ? '/mês' : billing_cycle === 'anual' ? '/ano' : '';
      return <div className="font-medium">{formattedValue} {cycleText}</div>;
    },
  },
  {
    accessorKey: "tipo_pagamento",
    header: "Pagamento",
    cell: ({ row }) => <span className="capitalize">{row.original.tipo_pagamento?.replace('_', ' ') || 'N/A'}</span>,
  },
  {
    accessorKey: "start_date",
    header: "Início",
    cell: ({ row }) => format(new Date(row.original.start_date), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "due_date",
    header: "Vencimento",
    cell: ({ row }) => row.original.due_date ? format(new Date(row.original.due_date), "dd/MM/yyyy", { locale: ptBR }) : "N/A",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/financeiro/${row.original.id}`)}>Ver Detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar Contrato</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];