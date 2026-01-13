import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { PipelineColumn, Stage } from '@/components/opportunities/PipelineColumn';
import { Opportunity } from '@/components/opportunities/OpportunityCard';
import { WinLossConfirmationModal } from '@/components/opportunities/WinLossConfirmationModal';
import { Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';

type FullOpportunity = Opportunity & { pipeline_stage_id: string };

const Opportunities = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<FullOpportunity[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    opportunity: FullOpportunity | null;
    targetStage: Stage | null;
  }>({ isOpen: false, opportunity: null, targetStage: null });

  const { isLoading: isLoadingStages, isError: isErrorStages } = useQuery({
    queryKey: ['pipelineStages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw new Error(error.message);
      setStages(data || []);
      return data;
    },
  });

  const { isLoading: isLoadingOpps, isError: isErrorOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          responsavel:profiles(full_name),
          lead:leads(nome, empresa)
        `);
      if (error) throw new Error(error.message);
      // Filter for open opportunities on the client side to keep the view clean
      setOpportunities(data?.filter(o => o.status === 'open') || []);
      return data;
    },
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, stageId, status, closed_at }: { id: string; stageId: string; status?: string; closed_at?: string | null }) => {
      const updateData: any = { pipeline_stage_id: stageId };
      if (status) updateData.status = status;
      if (closed_at !== undefined) updateData.closed_at = closed_at;
      
      const { error } = await supabase.from('opportunities').update(updateData).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      showSuccess(`Oportunidade ${variables.status === 'won' ? 'ganha' : variables.status === 'lost' ? 'perdida' : 'movida'}!`);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (error) => {
      showError(`Erro ao atualizar oportunidade: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const stagesIds = useMemo(() => stages.map((stage) => stage.id), [stages]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveAnOpportunity = active.data.current?.type === 'Opportunity';
    if (!isActiveAnOpportunity) return;

    const opportunityId = active.id as string;
    const newStageId = over.id as string;
    const originalStageId = active.data.current?.opportunity.pipeline_stage_id;

    if (newStageId === originalStageId) return;

    const opportunity = opportunities.find(o => o.id === opportunityId);
    const targetStage = stages.find(s => s.id === newStageId);

    if (!opportunity || !targetStage) return;

    if (targetStage.nome === 'Ganho' || targetStage.nome === 'Perdido') {
      setModalState({ isOpen: true, opportunity, targetStage });
    } else {
      setOpportunities(prev => prev.map(opp => opp.id === opportunityId ? { ...opp, pipeline_stage_id: newStageId } : opp));
      updateOpportunityMutation.mutate({ id: opportunityId, stageId: newStageId });
    }
  };

  const handleConfirmWinLoss = () => {
    if (!modalState.opportunity || !modalState.targetStage) return;
    const { opportunity, targetStage } = modalState;
    const status = targetStage.nome === 'Ganho' ? 'won' : 'lost';
    const closed_at = new Date().toISOString();
    updateOpportunityMutation.mutate({ id: opportunity.id, stageId: targetStage.id, status, closed_at });
    setModalState({ isOpen: false, opportunity: null, targetStage: null });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  if (isLoadingStages || isLoadingOpps) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (isErrorStages || isErrorOpps) {
    return <div className="text-red-400">Erro ao carregar os dados do pipeline.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Pipeline de Oportunidades</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <DndContext sensors={sensors} onDragEnd={onDragEnd} disabled={!canManage}>
          <SortableContext items={stagesIds}>
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                opportunities={opportunities.filter((opp) => opp.pipeline_stage_id === stage.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      {modalState.opportunity && modalState.targetStage && (
        <WinLossConfirmationModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, opportunity: null, targetStage: null })}
          onConfirm={handleConfirmWinLoss}
          isConfirming={updateOpportunityMutation.isPending}
          opportunityTitle={modalState.opportunity.titulo}
          targetStageName={modalState.targetStage.nome as "Ganho" | "Perdido"}
        />
      )}
    </div>
  );
};

export default Opportunities;