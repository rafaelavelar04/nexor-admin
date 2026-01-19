import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ShieldOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type ActiveSession = {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  last_seen_at: string;
  revoked_at: string | null;
  user: {
    full_name: string;
    role: string;
  };
};

export const parseUserAgent = (ua: string) => {
  if (!ua) return "Desconhecido";
  let browser = "Desconhecido";
  let os = "Desconhecido";

  if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

  return `${browser} em ${os}`;
};

export const getActiveSessionsColumns = (
  currentSessionId: string,
  onRevoke: (session: ActiveSession) => void
): ColumnDef<ActiveSession>[] => [
  {
    accessorKey: "user",
    header: "Usuário",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.user.full_name}</div>
        <div className="text-xs text-muted-foreground capitalize">{row.original.user.role}</div>
      </div>
    ),
  },
  {
    accessorKey: "ip_address",
    header: "Endereço IP",
  },
  {
    accessorKey: "user_agent",
    header: "Dispositivo",
    cell: ({ row }) => parseUserAgent(row.original.user_agent),
  },
  {
    accessorKey: "last_seen_at",
    header: "Última Atividade",
    cell: ({ row }) => formatDistanceToNow(new Date(row.original.last_seen_at), { addSuffix: true, locale: ptBR }),
  },
  {
    accessorKey: "revoked_at",
    header: "Status",
    cell: ({ row }) => {
      const isCurrent = row.original.session_id === currentSessionId;
      if (row.original.revoked_at) {
        return <Badge variant="destructive">Revogada</Badge>;
      }
      if (isCurrent) {
        return <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/30">Sessão Atual</Badge>;
      }
      return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">Ativa</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const session = row.original;
      const isCurrent = session.session_id === currentSessionId;
      const isRevoked = !!session.revoked_at;

      if (isCurrent || isRevoked) {
        return null;
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRevoke(session)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <ShieldOff className="mr-2 h-4 w-4" />
              Derrubar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];