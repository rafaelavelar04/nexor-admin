import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { ConvertLeadModal } from '@/components/leads/ConvertLeadModal';
import { Loader2, Users } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';

const LeadsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('leads')
          .select(`
            *,
            responsavel:profiles(full_name),
            tags(*)
          `)
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);

        if (isMounted) {
          const formattedData = data.map(lead => ({
            ...lead,
            responsavel: Array.isArray(lead.responsavel) ? lead.responsavel[0] : lead.responsavel,
            nome_empresa: `${lead.nome} ${lead.empresa}`
          })) as Lead[];
          setLeads(formattedData);
        }
      } catch (err: any) {
        console.error("Erro ao carregar os leads:", err);
        if (isMounted) {
          setError(err.message || 'Ocorreu um erro desconhecido.');
          setLeads([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLeads();

    return () => { isMounted = false; };
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (deletedId) => {
      showSuccess('Lead excluído com sucesso!');
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      showError(`Erro ao excluir lead: ${error.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => getColumns(handleDelete, handleConvert, profile?.role), [profile?.role]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (error) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro ao carregar os leads:</strong> {error}</div>;
    }
    if (leads.length === 0) {
      return (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Nenhum lead encontrado"
          description="Comece a prospectar e adicione seu primeiro lead para visualizá-lo aqui."
          cta={canManage ? { text: "Novo Lead", onClick: () => navigate('/admin/leads/novo') } : undefined}
        />
      );
    }
    return <LeadsDataTable columns={columns} data={leads} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie e qualifique seus contatos de prospecção.</p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/admin/leads/novo')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        )}
      </div>
      
      {renderContent()}

      <ConvertLeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        leadId={selectedLead?.id || null}
        leadName={selectedLead?.nome || null}
      />
    </div>
  );
};

export default LeadsPage;