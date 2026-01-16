import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Ticket, getColumns } from '@/components/tickets/TicketsTableColumns';
import { TicketsDataTable } from '@/components/tickets/TicketsDataTable';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: tickets, isLoading, isError } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, companies!company_id(id, nome), owner:profiles!owner_id(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, newStatus }: { ticketId: string, newStatus: string }) => {
      const { error } = await supabase
        .from('tickets')
        .update({ 
            status: newStatus,
            closed_at: ['resolvido', 'fechado'].includes(newStatus) ? new Date().toISOString() : null 
        })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status do ticket atualizado!");
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => showError(`Erro ao atualizar status: ${err.message}`),
  });

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateStatusMutation.mutate({ ticketId, newStatus });
  };

  const columns = getColumns(handleStatusChange);
  const canManage = profile?.role === 'admin' || profile?.role === 'operacoes';

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar os tickets.</div>;
    }
    if (!tickets || tickets.length === 0) {
      return (
        <EmptyState
          icon={<LifeBuoy className="w-12 h-12" />}
          title="Nenhum ticket aberto"
          description="Quando um cliente precisar de ajuda, você pode criar um ticket aqui para organizar o atendimento."
          cta={canManage ? { text: "Criar Primeiro Ticket", onClick: () => navigate('/admin/suporte/novo') } : undefined}
        />
      );
    }
    return <TicketsDataTable columns={columns} data={tickets} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
          <p className="text-muted-foreground mt-1">Gerencie os tickets e solicitações dos seus clientes.</p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/admin/suporte/novo')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Ticket
          </Button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default SupportPage;