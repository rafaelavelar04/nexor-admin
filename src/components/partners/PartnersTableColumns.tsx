import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

export type Partner = {
  id: string;
  nome: string;
  tipo_servico: string | null;
  modelo_pagamento: 'fixo' | 'por_contrato' | 'percentual' | null;
  valor_padrao: number | null;
  ativo: boolean;
  email: string | null;
};

const statusStyles = {
  true: "bg-green-500/20 text-green-300 border-green-500/30",
  false: "bg-gray-500/20 text-gray-300 border-gray-500/30",
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
    accessorKey: "tipo_servico",
    header: "Tipo de Serviço",
  },
  {
    accessorKey: "modelo_pagamento",
    header: "Modelo",
    cell: ({ row }) => <span className="capitalize">{row.original.modelo_pagamento?.replace('_', ' ') || 'N/A'}</span>,
  },
  {
    accessorKey: "valor_padrao",
    header: "Valor Padrão",
    cell: ({ row }) => row.original.valor_padrao ? formatCurrency(row.original.valor_padrao) : 'N/A',
  },
  {
    accessorKey: "ativo",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`capitalize ${statusStyles[String(row.original.ativo) as keyof typeof statusStyles]}`}>
        {row.original.ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
    filterFn: (row, id, value) => String(row.getValue(id)) === String(value),
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