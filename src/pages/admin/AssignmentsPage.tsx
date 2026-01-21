import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, UserCheck } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';

const AssignmentsPage = () => {
  const { profile } = useSession();
  const canManage = profile?.role === 'admin';

  const { data: assignments, isLoading, isError } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_assignments').select('*, partner:partners(nome), contract:contracts(id)');
      if (error) throw error;
      return data || [];
    },
  });

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
          cta={canManage ? { text: "Nova Alocação", onClick: () => alert("Formulário em desenvolvimento") } : undefined}
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
          <Button onClick={() => alert("Formulário em desenvolvimento")}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Alocação
          </Button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default AssignmentsPage;