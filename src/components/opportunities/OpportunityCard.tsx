import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Calendar, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFollowUpStatus } from '@/lib/followupUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';

export type Opportunity = {
  id: string;
  titulo: string;
  valor_estimado: number | null;
  responsavel: { full_name: string } | null;
  lead: { nome: string, empresa: string } | null;
  status: 'open' | 'won' | 'lost';
  proximo_followup: string | null;
};

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: {
      type: 'Opportunity',
      opportunity,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const followUpStatus = getFollowUpStatus(opportunity.proximo_followup);

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    if (isDragging) return;
    navigate(`/admin/opportunities/${opportunity.id}`);
  };

  return (
    <div ref={setNodeRef} style={style} onClick={handleCardClick}>
      <Card className={`bg-secondary border-transparent hover:border-primary/50 cursor-pointer transition-all duration-200 ${isDragging ? 'opacity-50 ring-2 ring-primary shadow-lg' : 'shadow-sm'}`}>
        <div {...attributes} {...listeners} className="p-4 cursor-grab">
          <p className="font-bold text-sm text-foreground mb-2">{opportunity.titulo}</p>
          <CardContent className="p-0 space-y-2 text-xs text-muted-foreground">
            {opportunity.lead && (
              <div className="flex items-center">
                <Building className="w-3.5 h-3.5 mr-2" />
                <span>{opportunity.lead.empresa}</span>
              </div>
            )}
            {followUpStatus && opportunity.proximo_followup && (
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2" />
                <span>{format(new Date(opportunity.proximo_followup), 'dd/MM/yyyy', { locale: ptBR })}</span>
                <Badge variant={followUpStatus.variant} className={`ml-auto text-xs ${followUpStatus.className}`}>{followUpStatus.text}</Badge>
              </div>
            )}
            <div className="flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-2" />
              <span>{formatCurrency(opportunity.valor_estimado)}</span>
            </div>
            <div className="flex items-center">
              <User className="w-3.5 h-3.5 mr-2" />
              <span>{opportunity.responsavel?.full_name || 'N/A'}</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};