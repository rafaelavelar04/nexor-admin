"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Briefcase, Link as LinkIcon, Instagram, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useNavigate } from "react-router-dom"

export type Lead = {
  id: string
  nome: string
  empresa: string
  instagram_empresa: string | null
  whatsapp: string | null
  nicho: string
  site_empresa: string | null
  responsavel: { full_name: string } | null
}

export const getColumns = (
  handleDelete: (id: string) => void,
  handleConvert: (lead: Lead) => void,
  role: string | null | undefined
): ColumnDef<Lead>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "instagram_empresa",
    header: "Instagram",
    cell: ({ row }) => {
      const instagram = row.original.instagram_empresa;
      if (!instagram) return "N/A";
      const url = instagram.startsWith('@') ? `https://instagram.com/${instagram.substring(1)}` : instagram;
      return <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:underline"><Instagram className="w-3 h-3" />{instagram}</a>
    },
    meta: {
      className: "hidden md:table-cell",
    },
  },
  {
    accessorKey: "whatsapp",
    header: "Telefone",
    cell: ({ row }) => {
      const phone = row.original.whatsapp;
      if (!phone) return "N/A";
      const cleanPhone = phone.replace(/\D/g, '');
      return <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:underline"><Phone className="w-3 h-3" />{phone}</a>
    },
  },
  {
    accessorKey: "nicho",
    header: "Nicho",
    meta: {
      className: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "site_empresa",
    header: "Site",
    cell: ({ row }) => {
      const site = row.original.site_empresa;
      if (!site) return "N/A";
      return <a href={site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:underline"><LinkIcon className="w-3 h-3" />Visitar</a>
    },
    meta: {
      className: "hidden lg:table-cell",
    },
  },
  {
    accessorKey: "responsavel",
    header: "Responsável",
    cell: ({ row }) => row.original.responsavel?.full_name || "N/A",
    enableSorting: false,
    meta: {
      className: "hidden md:table-cell",
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
]