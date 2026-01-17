"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFollowUpStatus } from "@/lib/followupUtils"

type Tag = {
  id: string;
  nome: string;
  cor: string | null;
}

export type Lead = {
  id: string
  nome: string
  empresa: string
  nicho: string
  responsavel_id: string
  status: string
  proximo_followup: string | null
  created_at: string
  responsavel: { full_name: string } | null
  tags: Tag[]
}

export const getColumns = (
  handleDelete: (id: string) => void,
  handleConvert: (lead: Lead) => void,
  role: string | null | undefined
): ColumnDef<Lead>[] => [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "responsavel",
    header: "Responsável",
    cell: ({ row }) => {
      const responsavel = row.original.responsavel;
      return responsavel ? responsavel.full_name : "N/A";
    },
    enableSorting: false,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags?.map(tag => (
          <Badge key={tag.id} variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {tag.nome}
          </Badge>
        ))}
      </div>
    ),
    filterFn: (row, columnId, filterValue: Set<string>) => {
      if (!filterValue || filterValue.size === 0) return true;
      const rowTags = row.original.tags;
      if (!rowTags || rowTags.length === 0) return false;
      return rowTags.some(tag => filterValue.has(tag.id));
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "proximo_followup",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Próximo Follow-up
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("proximo_followup")
      const followUpStatus = getFollowUpStatus(date as string | null);
      return (
        <div className="flex items-center gap-2">
          <span>{date ? format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</span>
          {followUpStatus && <Badge variant={followUpStatus.variant} className={followUpStatus.className}>{followUpStatus.text}</Badge>}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original
      const navigate = useNavigate()
      const canManage = role === 'admin' || role === 'vendas';

      if (!canManage) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 text-white border-gray-700">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/admin/leads/${lead.id}`)} className="cursor-pointer">
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleConvert(lead)} className="cursor-pointer">
              <Briefcase className="mr-2 h-4 w-4" />
              Converter em Oportunidade
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: "nome_empresa",
    header: "Nome ou Empresa",
    cell: () => null,
    enableHiding: true,
  },
]