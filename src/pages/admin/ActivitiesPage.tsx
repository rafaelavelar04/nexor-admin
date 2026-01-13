import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Activity, getColumns } from '@/components/activities/ActivitiesTableColumns';
import { ActivitiesDataTable } from '@/components/activities/ActivitiesDataTable';
import { ActivityFormDialog } from '@/components/activities/ActivityFormDialog';
import { EmptyState } from '@/components/common/EmptyState';

const ActivitiesPage = () => {
  const { profile } = useSession();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { data: activities, isLoading, isError } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_activities');
      if (error) throw error;
      return data || [];
    },
  });

  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedActivity(null);
  };

  const columns = getColumns({ onEdit: handleEdit, role: profile?.role });
  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (isError) {
        return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar as atividades.</div>;
    }

    if (!activities || activities.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="Nenhuma atividade encontrada"
          description="Comece registrando uma nova interação para visualizá-la aqui."
          cta={canManage ? {
            text: "Criar Primeira Atividade",
            onClick: () => setIsFormOpen(true),
          } : undefined}
        />
      );
    }
    
    return <ActivitiesDataTable columns={columns} data={activities} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atividades</h1>
          <p className="text-muted-foreground mt-1">Registre e acompanhe todas as interações.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        )}
      </div>

      {renderContent()}

      <ActivityFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseDialog}
        activity={selectedActivity}
      />
    </div>
  );
};

export default ActivitiesPage;