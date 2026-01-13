import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { OpportunityCard, Opportunity } from './OpportunityCard';

export type Stage = {
  id: string;
  nome: string;
  ordem: number;
};

interface PipelineColumnProps {
  stage: Stage;
  opportunities: Opportunity[];
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const PipelineColumn = ({ stage, opportunities }: PipelineColumnProps) => {
  const opportunitiesIds = opportunities.map((opp) => opp.id);
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.valor_estimado || 0), 0);

  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: 'Stage',
      stage,
    },
  });

  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0 bg-card rounded-lg flex flex-col h-[calc(100vh-16rem)] border border-border">
      <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-base text-foreground">{stage.nome}</h3>
          <span className="text-xs font-semibold bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{opportunities.length}</span>
        </div>
        <p className="text-sm font-semibold text-primary">{currencyFormatter.format(totalValue)}</p>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">Arraste oportunidades para esta etapa.</p>
          </div>
        ) : (
          <SortableContext items={opportunitiesIds}>
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
};