import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, Handshake } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { getColumns, Partner } from '@/components/partners/PartnersTableColumns';
import { PartnersDataTable } from '@/components/partners/PartnersDataTable';

const PartnersPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useSession();
  const canManage = profile?.role === 'admin';

  const { data: partners, isLoading, isError } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('*').order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Parceiro excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
    onError: (error: any) => showError(`Erro ao excluir: ${error.message}`),
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este parceiro?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(() => getColumns(handleDelete, canManage), [canManage]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar os parceiros.</div>;
    }
    if (!partners || partners.length === 0) {
      return (
        <EmptyState
          icon={<Handshake className="w-12 h-12" />}
          title="Nenhum parceiro cadastrado"
          description="Adicione os parceiros da sua empresa para começar a gerenciar alocações e custos."
          cta={canManage ? { text: "Novo Parceiro", onClick: () => navigate('/admin/parceiros/novo') } : undefined}
        />
      );
    }
    return <PartnersDataTable columns={columns} data={partners} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua rede de parceiros e colaboradores.</p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/admin/parceiros/novo')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Parceiro
          </Button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default PartnersPage;