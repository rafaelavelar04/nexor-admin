import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export type Ticket = {
  id: string;
  title: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado';
  created_at: string;
  companies: { nome: string } | null;
  owner: { full_name: string } | null;
};

const statusStyles: Record<Ticket['status'], string> = {
  aberto: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  em_atendimento: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  resolvido: "bg-green-500/20 text-green-300 border-green-500/30",
  fechado: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const priorityStyles: Record<Ticket['priority'], string> = {
  baixa: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  alta: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const getColumns = (
  onStatusChange: (ticketId: string, newStatus: string) => void
): ColumnDef<Ticket>[] => [
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.priority === 'alta' && <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />}
        <p className="font-medium truncate max-w-xs">{row.original.title}</p>
      </div>
    ),
  },
  {
    accessorKey: "companies",
    header: "Empresa",
    cell: ({ row }) => row.original.companies?.nome || "N/A",
    filterFn: (row, id, value) => value === row.original.companies?.id,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const ticket = row.original;
      const statuses = ['aberto', 'em_atendimento', 'resolvido', 'fechado'];
      
      return (
        <Select
          value={ticket.status}
          onValueChange={(newStatus) => onStatusChange(ticket.id, newStatus)}
        >
          <SelectTrigger className={cn("w-[160px] capitalize border-0 focus:ring-0 focus:ring-offset-0", statusStyles[ticket.status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
    cell: ({ row }) => (
      <Badge className={`capitalize ${priorityStyles[row.original.priority]}`}>
        {row.original.priority}
      </Badge>
    ),
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "owner",
    header: "Responsável",
    cell: ({ row }) => row.original.owner?.full_name || "N/A",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Criado em <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.created_at), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/suporte/${row.original.id}`)}>Ver / Editar Detalhes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];