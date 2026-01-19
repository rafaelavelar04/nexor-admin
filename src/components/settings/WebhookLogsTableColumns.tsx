import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, CheckCircle, XCircle } from "lucide-react";

export type WebhookLog = {
  id: number;
  event: string;
  status_code: number | null;
  success: boolean;
  payload: object | null;
  response: string | null;
  created_at: string;
};

export const getWebhookLogsColumns = (onViewDetails: (log: WebhookLog) => void): ColumnDef<WebhookLog>[] => [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Data <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
  },
  {
    accessorKey: "event",
    header: "Evento",
  },
  {
    accessorKey: "success",
    header: "Status",
    cell: ({ row }) => {
      const { success, status_code } = row.original;
      return (
        <div className="flex items-center gap-2">
          {success ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <Badge variant={success ? "default" : "destructive"} className={success ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
            {status_code || 'Falha'}
          </Badge>
        </div>
      );
    },
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