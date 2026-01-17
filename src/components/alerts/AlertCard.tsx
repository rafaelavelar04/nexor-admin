import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertCircle, Archive, Check, Info, MoreHorizontal, Clock, Trash2, Undo } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AlertData {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  module: string;
  link: string;
  timestamp: string;
  isRead: boolean;
}

interface AlertCardProps {
  alert: AlertData;
  onMarkRead: (id: string, read: boolean) => void;
  onSnooze: (id: string, hours: number) => void;
  onArchive: (id: string) => void;
}

const severityConfig = {
  info: { icon: <Info className="h-5 w-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
  warning: { icon: <AlertCircle className="h-5 w-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  critical: { icon: <Trash2 className="h-5 w-5" />, color: "text-red-400", bg: "bg-red-500/10" },
};

export const AlertCard = ({ alert, onMarkRead, onSnooze, onArchive }: AlertCardProps) => {
  const config = severityConfig[alert.severity];

  return (
    <Alert className={`relative border-l-4 ${config.bg} ${alert.isRead ? 'opacity-60' : ''}`} style={{ borderColor: `var(--${alert.severity}-color)` }}>
      <div className={`absolute top-3 right-3 ${config.color}`}>{config.icon}</div>
      <AlertTitle className="font-bold text-foreground pr-8">{alert.title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <p>{alert.description}</p>
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{alert.module}</Badge>
            <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="link" size="sm" asChild className="text-cyan-400 h-auto p-0">
              <Link to={alert.link}>Ver Detalhes</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMarkRead(alert.id, !alert.isRead)}>
                  {alert.isRead ? <Undo className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Marcar como {alert.isRead ? 'não lida' : 'lida'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(alert.id, 1)}><Clock className="w-4 h-4 mr-2" /> Adiar 1 hora</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(alert.id, 24)}><Clock className="w-4 h-4 mr-2" /> Adiar 1 dia</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(alert.id)}><Archive className="w-4 h-4 mr-2" /> Arquivar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};