import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type AuditLog = {
  id: number;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_data: object | null;
  after_data: object | null;
  created_at: string;
  user: { full_name: string } | null;
};

export const getAuditLogColumns = (onViewDetails: (log: AuditLog) => void): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Data <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  },
  {
    accessorKey: "user",
    header: "Usuário",
    cell: ({ row }) => row.original.user?.full_name || 'Sistema',
  },
  {
    accessorKey: "action",
    header: "Ação",
  },
  {
    accessorKey: "entity",
    header: "Entidade",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onViewDetails(row.original)}>
        Ver Detalhes
      </Button>
    ),
  },
];