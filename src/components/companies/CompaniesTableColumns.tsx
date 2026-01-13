"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

export type Company = {
  id: string
  nome: string
  segmento: string | null
  site: string | null
}

export const getColumns = (
  handleDelete: (id: string) => void,
  role: string | null | undefined
): ColumnDef<Company>[] => [
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "segmento",
    header: "Segmento",
  },
  {
    accessorKey: "site",
    header: "Site",
    cell: ({ row }) => {
      const site = row.original.site;
      if (!site) return "N/A";
      return <a href={site} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{site}</a>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const company = row.original
      const navigate = useNavigate()
      const isAdmin = role === 'admin';

      if (!isAdmin) return null;

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
            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}`)} className="cursor-pointer">
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(company.id)} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]