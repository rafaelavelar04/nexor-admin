import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { PipelineColumn, Stage } from '@/components/opportunities/PipelineColumn';
import { Opportunity } from '@/components/opportunities/OpportunityCard';
import { Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';

type FullOpportunity = Opportunity & { pipeline_stage_id: string };

const Opportunities = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<FullOpportunity[]>([]);

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
        // RLS handles filtering, no need for .eq('status', 'open') here for all roles
      if (error) throw new Error(error.message);
      setOpportunities(data || []);
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
    onSuccess: () => {
      showSuccess('Oportunidade atualizada!');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (error) => {
      showError(`Erro ao mover oportunidade: ${error.message}`);
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

    setOpportunities(prev => {
      return prev.map(opp => 
        opp.id === opportunityId ? { ...opp, pipeline_stage_id: newStageId } : opp
      );
    });

    const targetStage = stages.find(s => s.id === newStageId);
    let status;
    let closed_at: string | null = null;

    if (targetStage?.nome === 'Ganho') {
      status = 'won';
      closed_at = new Date().toISOString();
    } else if (targetStage?.nome === 'Perdido') {
      status = 'lost';
      closed_at = new Date().toISOString();
    }

    updateOpportunityMutation.mutate({ id: opportunityId, stageId: newStageId, status, closed_at });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

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
    </div>
  );
};

export default Opportunities;