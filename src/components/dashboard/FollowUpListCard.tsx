import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

interface FollowUpItem {
  id: string;
  type: 'Lead' | 'Oportunidade';
  name: string;
  responsible: string;
  date: string;
}

interface FollowUpListCardProps {
  title: string;
  items: FollowUpItem[];
  badgeText: string;
  badgeClass: string;
}

export const FollowUpListCard = ({ title, items, badgeText, badgeClass }: FollowUpListCardProps) => {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
        <Badge className={badgeClass}>{items.length} {badgeText}</Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum item encontrado.</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Link to={`/admin/${item.type === 'Lead' ? 'leads' : 'opportunities'}/${item.id}`} key={`${item.type}-${item.id}`} className="block p-2 rounded-md hover:bg-secondary transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-semibold ${item.type === 'Lead' ? 'text-cyan-400' : 'text-purple-400'}`}>{item.type}</span>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.responsible}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};