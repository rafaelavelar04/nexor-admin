import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

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
  company: { nome: string } | null;
  opportunity: { titulo: string } | null;
};

const statusStyles: Record<Contract['status'], string> = {
  ativo: "bg-green-500/20 text-green-300 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
  finalizado: "bg-gray-500/20 text-gray-300 border-gray-500/30",
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
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: "start_date",
    header: "Início",
    cell: ({ row }) => format(new Date(row.original.start_date), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: "end_date",
    header: "Fim",
    cell: ({ row }) => row.original.end_date ? format(new Date(row.original.end_date), "dd/MM/yyyy", { locale: ptBR }) : 'Indeterminado',
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];