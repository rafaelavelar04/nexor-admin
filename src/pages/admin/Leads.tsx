import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { ConvertLeadModal } from '@/components/leads/ConvertLeadModal';
import { LeadImportDialog } from '@/components/leads/LeadImportDialog';
import { BulkActionBar } from '@/components/leads/BulkActionBar';
import { Loader2, Users, Upload, Download } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { RowSelectionState, ColumnFiltersState } from '@tanstack/react-table';
import { exportToCsv } from '@/lib/exportUtils';
import { SavedFiltersManager } from '@/components/common/SavedFiltersManager';

const LeadsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  const { data: fetchedData, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`*, responsavel:profiles(full_name), tags(*)`)
        .order('created_at', { ascending: false });
      if (fetchError) throw new Error(fetchError.message);
      return data;
    }
  });

  useEffect(() => {
    if (fetchedData) {
      const formattedData = fetchedData.map(lead => ({
        ...lead,
        responsavel: Array.isArray(lead.responsavel) ? lead.responsavel[0] : lead.responsavel,
        nome_empresa: `${lead.nome} ${lead.empresa}`
      })) as Lead[];
      setLeads(formattedData);
      setError(null);
    }
    if (isError) {
      setError('Ocorreu um erro ao carregar os leads.');
    }
    setIsLoading(false);
  }, [fetchedData, isError]);

  const { data: users } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ leadIds, updates }: { leadIds: string[], updates: Partial<Lead> }) => {
      const { error } = await supabase.from('leads').update(updates).in('id', leadIds);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      showSuccess(`${variables.leadIds.length} leads atualizados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setRowSelection({});
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const { error } = await supabase.from('leads').delete().in('id', leadIds);
      if (error) throw error;
    },
    onSuccess: (_, leadIds) => {
      showSuccess(`${leadIds.length} leads excluídos com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setRowSelection({});
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const selectedLeadIds = useMemo(() => Object.keys(rowSelection).map(index => leads[parseInt(index, 10)]?.id).filter(Boolean), [rowSelection, leads]);

  const handleBulkStatusChange = (status: string) => {
    if (window.confirm(`Tem certeza que deseja alterar o status de ${selectedLeadIds.length} leads para "${status}"?`)) {
      bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, updates: { status } });
    }
  };

  const handleBulkOwnerChange = (responsavel_id: string) => {
    const ownerName = users?.find(u => u.id === responsavel_id)?.full_name || 'desconhecido';
    if (window.confirm(`Tem certeza que deseja atribuir ${selectedLeadIds.length} leads para "${ownerName}"?`)) {
      bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, updates: { responsavel_id } });
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedLeadIds.length} leads? Esta ação não pode ser desfeita.`)) {
      bulkDeleteMutation.mutate(selectedLeadIds);
    }
  };

  const handleBulkExport = () => {
    const selectedData = Object.keys(rowSelection).map(index => {
      const lead = leads[parseInt(index, 10)];
      const { responsavel, tags, ...rest } = lead;
      return {
        ...rest,
        responsavel_nome: responsavel?.full_name || 'N/A',
        tags: tags.map(t => t.nome).join(', '),
      };
    });
    exportToCsv(`leads_selecionados_${new Date().toISOString().split('T')[0]}.csv`, selectedData);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Lead excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => showError(`Erro ao excluir lead: ${error.message}`),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const columns = useMemo(() => getColumns(handleDelete, handleConvert, profile?.role), [profile?.role]);

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro:</strong> {error}</div>;
    if (leads.length === 0 && columnFilters.length === 0) {
      return <EmptyState icon={<Users className="w-12 h-12" />} title="Nenhum lead encontrado" description="Adicione seu primeiro lead para visualizá-lo aqui." cta={canManage ? { text: "Novo Lead", onClick: () => navigate('/admin/leads/novo') } : undefined} />;
    }
    return <LeadsDataTable columns={columns} data={leads} rowSelection={rowSelection} setRowSelection={setRowSelection} columnFilters={columnFilters} setColumnFilters={setColumnFilters} />;
  };

  const statusOptions = ["Não contatado", "Primeiro contato feito", "Sem resposta", "Em conversa", "Follow-up agendado", "Não interessado"];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie e qualifique seus contatos de prospecção.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsImportModalOpen(true)} variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
            <Button onClick={() => navigate('/admin/leads/novo')}><PlusCircle className="w-4 h-4 mr-2" />Novo Lead</Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-end">
        <SavedFiltersManager pageKey="leads" currentFilters={columnFilters} onApplyFilter={setColumnFilters} onClearFilters={() => setColumnFilters([])} />
      </div>

      {renderContent()}

      {canManage && (
        <BulkActionBar
          selectedCount={selectedLeadIds.length}
          onStatusChange={handleBulkStatusChange}
          onOwnerChange={handleBulkOwnerChange}
          onAddTags={() => alert("Funcionalidade 'Adicionar Tags' em desenvolvimento.")}
          onRemoveTags={() => alert("Funcionalidade 'Remover Tags' em desenvolvimento.")}
          onExport={handleBulkExport}
          onDelete={handleBulkDelete}
          statusOptions={statusOptions}
          users={users || []}
        />
      )}

      <ConvertLeadModal isOpen={isConvertModalOpen} onClose={() => { setIsConvertModalOpen(false); setSelectedLead(null); }} leadId={selectedLead?.id || null} leadName={selectedLead?.nome || null} />
      <LeadImportDialog isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
};

export default LeadsPage;