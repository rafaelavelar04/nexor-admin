import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, UserCheck } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { showSuccess, showError } from '@/utils/toast';
// import { getColumns, Assignment } from '@/components/assignments/AssignmentsTableColumns';
// import { AssignmentsDataTable } from '@/components/assignments/AssignmentsDataTable';
// import { AssignmentFormDialog } from '@/components/assignments/AssignmentFormDialog';

const AssignmentsPage = () => {
  const { profile } = useSession();
  const canManage = profile?.role === 'admin';
  const [isFormOpen, setIsFormOpen] = useState(false);
  // const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const { data: assignments, isLoading, isError } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_assignments').select('*, partner:partners(nome), contract:contracts(id), company:companies(nome)');
      if (error) throw error;
      return data || [];
    },
  });

  const handleEdit = (assignment: any) => {
    // setSelectedAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    alert(`Delete functionality for ${id} is in development.`);
  };

  // const columns = useMemo(() => getColumns(handleEdit, handleDelete, canManage), [canManage]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar as alocações.</div>;
    }
    if (!assignments || assignments.length === 0) {
      return (
        <EmptyState
          icon={<UserCheck className="w-12 h-12" />}
          title="Nenhuma alocação encontrada"
          description="Aloque parceiros a contratos ou projetos para começar a gerenciar os custos e a execução."
          cta={canManage ? { text: "Nova Alocação", onClick: () => setIsFormOpen(true) } : undefined}
        />
      );
    }
    // Placeholder until table is created
    return <div className="rounded-md border p-4">Funcionalidade de tabela em desenvolvimento.</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alocações</h1>
          <p className="text-muted-foreground mt-1">Gerencie os parceiros alocados em cada projeto e contrato.</p>
        </div>
        {canManage && (
          <Button onClick={() => { /*setSelectedAssignment(null);*/ setIsFormOpen(true); }}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Alocação
          </Button>
        )}
      </div>
      {renderContent()}
      {/* <AssignmentFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        assignment={selectedAssignment}
      /> */}
    </div>
  );
};

export default AssignmentsPage;