import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { OpportunityHeader } from '@/components/opportunities/OpportunityHeader';
import { LeadDetailsCard } from '@/components/opportunities/LeadDetailsCard';
import { ActivityTimeline } from '@/components/opportunities/ActivityTimeline';
import { AuditHistory } from '@/components/opportunities/AuditHistory';
import { InternalNotes } from '@/components/opportunities/InternalNotes';
import { useSession } from '@/contexts/SessionContext';

const OpportunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useSession();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: oppData, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          lead:leads(*),
          responsavel:profiles(id, full_name),
          pipeline_stage:pipeline_stages(nome)
        `)
        .eq('id', id)
        .single();
      if (oppError) throw new Error(`Opportunity: ${oppError.message}`);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*, user:profiles(full_name)')
        .eq('opportunity_id', id)
        .order('activity_date', { ascending: false });
      if (activitiesError) throw new Error(`Activities: ${activitiesError.message}`);

      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*, user:profiles(full_name)')
        .eq('entity', 'opportunity')
        .eq('entity_id', id)
        .order('created_at', { ascending: false });
      if (auditError) throw new Error(`Audit: ${auditError.message}`);

      return { opportunity: oppData, activities: activitiesData, auditLogs: auditData };
    },
    enabled: !!id,
  });

  const canEdit = profile?.role === 'admin' || (profile?.role === 'vendas' && data?.opportunity?.responsavel_id === profile.id);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 bg-red-500/10 p-6 rounded-md">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-white">Erro ao Carregar Oportunidade</h2>
        <p className="text-center text-red-300">{error?.message || "Não foi possível carregar os dados. Verifique se a oportunidade existe e se você tem permissão para visualizá-la."}</p>
      </div>
    );
  }

  if (!data) {
    return <div>Oportunidade não encontrada.</div>;
  }

  const { opportunity, activities, auditLogs } = data;

  return (
    <div className="space-y-6">
      <OpportunityHeader opportunity={opportunity} canEdit={canEdit} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline opportunityId={opportunity.id} initialActivities={activities} canEdit={canEdit} />
          <AuditHistory auditLogs={auditLogs} />
        </div>
        <div className="space-y-6">
          <LeadDetailsCard lead={opportunity.lead} />
          <InternalNotes opportunity={opportunity} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailPage;