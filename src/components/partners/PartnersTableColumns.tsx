import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export type Partner = {
  id: string;
  nome: string;
  area: string | null;
  status: 'ativo' | 'inativo';
  email: string | null;
  whatsapp: string | null;
};

const statusStyles: Record<Partner['status'], string> = {
  ativo: "bg-green-500/20 text-green-300 border-green-500/30",
  inativo: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const getColumns = (
  handleDelete: (id: string) => void,
  canManage: boolean
): ColumnDef<Partner>[] => [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nome <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "area",
    header: "Área",
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "whatsapp",
    header: "WhatsApp",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`capitalize ${statusStyles[row.original.status]}`}>
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const navigate = useNavigate();
      if (!canManage) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/parceiros/${row.original.id}`)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-destructive focus:text-destructive/90 focus:bg-destructive/10">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];