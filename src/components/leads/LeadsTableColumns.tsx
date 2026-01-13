"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Lead = {
  id: string
  nome: string
  empresa: string
  nicho: string
  responsavel_id: string
  status: string
  proximo_followup: string | null
  created_at: string
  profile: { full_name: string } | null
}

export const getColumns = (
  handleDelete: (id: string) => void
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
    accessorKey: "nicho",
    header: "Nicho",
  },
  {
    accessorKey: "profile.full_name",
    header: "Responsável",
    cell: ({ row }) => row.original.profile?.full_name || 'N/A',
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
      return date ? format(new Date(date as string), "dd/MM/yyyy") : "N/A"
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data de Criação
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      const date = row.getValue("created_at")
      return format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR })
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original
      const navigate = useNavigate()

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