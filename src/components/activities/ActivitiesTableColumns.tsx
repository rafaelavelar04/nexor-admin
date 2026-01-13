import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, ArrowUpDown, MessageSquare, Phone, Users, Building, Briefcase, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getFollowUpStatus } from "@/lib/followupUtils";

export type Activity = {
  id: string;
  type: 'Email' | 'Call' | 'Meeting';
  description: string;
  activity_date: string;
  proximo_followup: string | null;
  user: { id: string; full_name: string } | null;
  lead: { id: string; nome: string } | null;
  opportunity: { id: string; titulo: string } | null;
  company: { id: string; nome: string } | null;
};

const activityIcons = {
  Email: <MessageSquare className="w-4 h-4" />,
  Call: <Phone className="w-4 h-4" />,
  Meeting: <Users className="w-4 h-4" />,
};

interface GetColumnsProps {
  onEdit: (activity: Activity) => void;
  role: string | null | undefined;
}

export const getColumns = ({ onEdit, role }: GetColumnsProps): ColumnDef<Activity>[] => [
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {activityIcons[row.original.type]}
        <span>{row.original.type}</span>
      </div>
    ),
    filterFn: (row, id, value) => value === row.getValue(id),
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <p className="truncate max-w-xs">{row.original.description}</p>,
  },
  {
    id: "related_to",
    header: "Relacionado a",
    cell: ({ row }) => {
      const { lead, opportunity, company } = row.original;
      if (lead) return <Link to={`/admin/leads/${lead.id}`} className="flex items-center gap-2 text-cyan-400 hover:underline"><UserIcon className="w-4 h-4" />{lead.nome}</Link>;
      if (opportunity) return <Link to={`/admin/opportunities/${opportunity.id}`} className="flex items-center gap-2 text-purple-400 hover:underline"><Briefcase className="w-4 h-4" />{opportunity.titulo}</Link>;
      if (company) return <Link to={`/admin/companies/${company.id}`} className="flex items-center gap-2 text-orange-400 hover:underline"><Building className="w-4 h-4" />{company.nome}</Link>;
      return "N/A";
    },
  },
  {
    accessorKey: "user",
    header: "Responsável",
    cell: ({ row }) => row.original.user?.full_name || "N/A",
    filterFn: (row, id, value) => value === row.original.user?.id,
  },
  {
    accessorKey: "activity_date",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Data <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.activity_date), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    filterFn: (row, id, value: { from?: Date, to?: Date }) => {
        if (!value?.from) return true;
        const date = new Date(row.getValue(id));
        const from = value.from;
        const to = value.to ? new Date(value.to.getTime() + 86400000) : new Date(from.getTime() + 86400000); // include the whole day
        return date >= from && date < to;
    }
  },
  {
    accessorKey: "proximo_followup",
    header: "Próx. Follow-up",
    cell: ({ row }) => {
      const date = row.original.proximo_followup;
      const status = getFollowUpStatus(date);
      if (!date) return "N/A";
      return (
        <div className="flex items-center gap-2">
          <span>{format(new Date(date), "dd/MM/yyyy")}</span>
          {status && <Badge variant={status.variant} className={status.className}>{status.text}</Badge>}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const canManage = role === 'admin'; // Simplified for now
      if (!canManage) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];