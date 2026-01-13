import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User } from 'lucide-react';

export type Opportunity = {
  id: string;
  titulo: string;
  valor_estimado: number | null;
  responsavel: { full_name: string } | null;
  lead: { nome: string, empresa: string } | null;
};

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`mb-4 bg-gray-800 border-gray-700 text-white hover:border-cyan-500/50 cursor-grab ${isDragging ? 'opacity-50 ring-2 ring-cyan-500' : ''}`}>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{opportunity.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 text-sm text-gray-400">
          {opportunity.lead && (
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">{opportunity.lead.empresa}</Badge>
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
      </Card>
    </div>
  );
};