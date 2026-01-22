import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

export type Assignment = {
  id: string;
  service_name: string;
  valor_combinado: number;
  status: 'em_execucao' | 'finalizado' | 'cancelado';
  start_date: string | null;
  end_date: string | null;
  partner: { nome: string } | null;
  company: { nome: string } | null;
  responsavel: { full_name: string } | null;
};

const statusStyles: Record<Assignment['status'], string> = {
  em_execucao: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  finalizado: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const getColumns = (
  onEdit: (assignment: Assignment) => void,
  onDelete: (id: string) => void,
  canManage: boolean
): ColumnDef<Assignment>[] => [
  { accessorKey: "partner", header: "Parceiro", cell: ({ row }) => row.original.partner?.nome || "N/A" },
  { accessorKey: "service_name", header: "Serviço/Papel" },
  { accessorKey: "company", header: "Cliente", cell: ({ row }) => row.original.company?.nome || "N/A" },
  { accessorKey: "valor_combinado", header: "Valor", cell: ({ row }) => formatCurrency(row.original.valor_combinado) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge className={`capitalize ${statusStyles[row.original.status]}`}>{row.original.status.replace('_', ' ')}</Badge> },
  { accessorKey: "start_date", header: "Início", cell: ({ row }) => row.original.start_date ? format(new Date(row.original.start_date), "dd/MM/yyyy", { locale: ptBR }) : "N/A" },
  {
    id: "actions",
    cell: ({ row }) => {
      if (!canManage) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original.id)} className="text-destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];