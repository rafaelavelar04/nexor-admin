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
    <div ref={setNodeRef} className="w-80 flex-shrink-0 bg-gray-800/50 rounded-lg flex flex-col h-[calc(100vh-15rem)]">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-lg">{stage.nome}</h3>
          <span className="text-sm font-semibold bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">{opportunities.length}</span>
        </div>
        <p className="text-sm font-semibold text-cyan-400">{currencyFormatter.format(totalValue)}</p>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">Nenhuma oportunidade aqui.</p>
          </div>
        ) : (
          <SortableContext items={opportunitiesIds}>
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};