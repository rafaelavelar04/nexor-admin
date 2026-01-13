import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFollowUpStatus } from '@/lib/followupUtils';
import { format } from 'date-fns';

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

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const followUpStatus = getFollowUpStatus(opportunity.proximo_followup);

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) return;
    if (isDragging) return;
    navigate(`/admin/opportunities/${opportunity.id}`);
  };

  return (
    <div ref={setNodeRef} style={style} onClick={handleCardClick}>
      <Card className={`mb-4 bg-gray-800 border-gray-700 text-white hover:border-cyan-500/50 cursor-pointer ${isDragging ? 'opacity-50 ring-2 ring-cyan-500' : ''}`}>
        <div {...attributes} {...listeners} className="p-4 cursor-grab">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-semibold">{opportunity.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2 space-y-3 text-sm text-gray-400">
            {opportunity.lead && (
              <Badge variant="secondary" className="bg-gray-700 text-gray-300 font-normal">{opportunity.lead.empresa}</Badge>
            )}
            {followUpStatus && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(new Date(opportunity.proximo_followup!), 'dd/MM/yy')}</span>
                <Badge variant={followUpStatus.variant} className={`ml-2 ${followUpStatus.className}`}>{followUpStatus.text}</Badge>
              </div>
            )}
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>{opportunity.valor_estimado ? currencyFormatter.format(opportunity.valor_estimado) : 'Não definido'}</span>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>{opportunity.responsavel?.full_name || 'N/A'}</span>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};