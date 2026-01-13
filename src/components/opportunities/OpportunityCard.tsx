import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type Opportunity = {
  id: string;
  titulo: string;
  valor_estimado: number | null;
  responsavel: { full_name: string } | null;
  lead: { nome: string, empresa: string } | null;
  status: 'open' | 'won' | 'lost';
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

  const statusStyles = {
    open: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 capitalize',
    won: 'bg-green-500/20 text-green-300 border-green-500/30 capitalize',
    lost: 'bg-red-500/20 text-red-300 border-red-500/30 capitalize',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when dragging
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
            <div className="flex items-center gap-2">
              {opportunity.lead && (
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 font-normal">{opportunity.lead.empresa}</Badge>
              )}
              <Badge className={statusStyles[opportunity.status]}>{opportunity.status}</Badge>
            </div>
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