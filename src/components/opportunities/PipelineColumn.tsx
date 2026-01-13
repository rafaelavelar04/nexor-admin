import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { useMemo } from 'react';
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

export const PipelineColumn = ({ stage, opportunities }: PipelineColumnProps) => {
  const opportunitiesIds = useMemo(() => opportunities.map((opp) => opp.id), [opportunities]);

  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: 'Stage',
      stage,
    },
  });

  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0 bg-gray-800/50 rounded-lg p-4 flex flex-col">
      <h3 className="font-bold text-lg mb-4 px-2">{stage.nome}</h3>
      <div className="flex-grow overflow-y-auto pr-2">
        <SortableContext items={opportunitiesIds}>
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};