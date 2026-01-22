import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { ConvertLeadModal } from '@/components/leads/ConvertLeadModal';
import { LeadImportDialog } from '@/components/leads/LeadImportDialog';
import { BulkActionBar } from '@/components/leads/BulkActionBar';
import { Loader2, Users, Upload, Trash2, User, Tag, Activity, Calendar } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { RowSelectionState, ColumnFiltersState, useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, SortingState } from '@tanstack/react-table';
import { exportToCsv } from '@/lib/exportUtils';
import { SavedFiltersManager } from '@/components/common/SavedFiltersManager';
import { useActionManager } from '@/contexts/ActionManagerContext';
import { DateRange } from 'react-day-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BulkActionDialog, BulkActionType } from '@/components/leads/BulkActionDialog';
import { NICHOS } from '@/lib/constants';
import { format } from 'date-fns';

const LeadsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useSession();
  const { performAction } = useActionManager();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteFilteredAlertOpen, setIsDeleteFilteredAlertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType | null>(null);

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

  const selectedLeadIds = useMemo(() => Object.keys(rowSelection).map(index => leads[parseInt(index, 10)]?.id).filter(Boolean), [rowSelection, leads]);
  const selectedLeads = useMemo(() => Object.keys(rowSelection).map(index => leads[parseInt(index, 10)]).filter(Boolean), [rowSelection, leads]);

  const handleBulkStatusChange = (status: string) => {
    performAction({
      message: `${selectedLeadIds.length} leads tiveram o status alterado para "${status}".`,
      action: async () => {
        const { error } = await supabase.from('leads').update({ status }).in('id', selectedLeadIds);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        setRowSelection({});
      },
      undoAction: async () => {
        showError("Ação de desfazer para alteração de status em massa não está implementada.");
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  };

  const handleBulkOwnerChange = (responsavel_id: string) => {
    const ownerName = users?.find(u => u.id === responsavel_id)?.full_name || 'desconhecido';
    performAction({
      message: `${selectedLeadIds.length} leads foram atribuídos a "${ownerName}".`,
      action: async () => {
        const { error } = await supabase.from('leads').update({ responsavel_id }).in('id', selectedLeadIds);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        setRowSelection({});
      },
      undoAction: async () => {
        showError("Ação de desfazer para atribuição em massa não está implementada.");
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  };

  const handleBulkDelete = () => {
    const leadsToDelete = [...selectedLeads]; // Copia para evitar problemas de referência
    performAction({
      message: `${leadsToDelete.length} leads foram excluídos.`,
      action: async () => {
        const { error } = await supabase.from('leads').delete().in('id', leadsToDelete.map(l => l.id));
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        setRowSelection({});
      },
      undoAction: async () => {
        const leadsToRestore = leadsToDelete.map(({ id, created_at, updated_at, responsavel, tags, ...rest }) => rest);
        const { error } = await supabase.from('leads').insert(leadsToRestore);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  };

  const handleBulkExport = () => {
    const selectedData = selectedLeads.map(lead => {
      const { responsavel, ...rest } = lead;
      return {
        ...rest,
        responsavel_nome: responsavel?.full_name || 'N/A',
      };
    });
    exportToCsv(`leads_selecionados_${new Date().toISOString().split('T')[0]}.csv`, selectedData);
  };

  const handleDelete = (id: string) => {
    const leadToDelete = leads.find(l => l.id === id);
    if (!leadToDelete) return;

    performAction({
      message: `Lead "${leadToDelete.nome}" foi excluído.`,
      action: async () => {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
      undoAction: async () => {
        const { id: _, created_at, updated_at, responsavel, ...rest } = leadToDelete;
        const { error } = await supabase.from('leads').insert(rest);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const columns = useMemo(() => getColumns(handleDelete, handleConvert, profile?.role), [profile?.role]);

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  });

  useEffect(() => {
    table.getColumn("created_at")?.setFilterValue(dateRange);
  }, [dateRange, table]);

  const filteredLeads = table.getFilteredRowModel().rows;
  const isFiltered = columnFilters.length > 0 || dateRange;

  const handleConfirmDeleteFiltered = () => {
    const leadsToDelete = isFiltered ? filteredLeads.map(row => row.original as Lead) : leads;
    const leadIdsToDelete = leadsToDelete.map(l => l.id);

    performAction({
      message: `${leadIdsToDelete.length} leads foram excluídos.`,
      action: async () => {
        const { error } = await supabase.from('leads').delete().in('id', leadIdsToDelete);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
      undoAction: async () => {
        const leadsToRestore = leadsToDelete.map(({ id, created_at, updated_at, responsavel, tags, ...rest }) => rest);
        const { error } = await supabase.from('leads').insert(leadsToRestore);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
    setIsDeleteFilteredAlertOpen(false);
  };

  const openBulkActionDialog = (action: BulkActionType) => {
    if (filteredLeads.length === 0) {
      showError("Nenhum lead corresponde aos filtros aplicados para realizar a ação.");
      return;
    }
    setCurrentBulkAction(action);
    setIsBulkActionModalOpen(true);
  };

  const handleConfirmBulkAction = (value: any) => {
    const leadIdsToUpdate = filteredLeads.map(row => row.original.id);
    let updateData: Record<string, any> = {};
    let successMessage = '';
  
    switch (currentBulkAction) {
      case 'assign_owner':
        updateData = { responsavel_id: value };
        const ownerName = users?.find(u => u.id === value)?.full_name || 'desconhecido';
        successMessage = `${leadIdsToUpdate.length} leads foram atribuídos a "${ownerName}".`;
        break;
      case 'change_status':
        updateData = { status: value };
        successMessage = `${leadIdsToUpdate.length} leads tiveram o status alterado para "${value}".`;
        break;
      case 'change_niche':
        updateData = { nicho: value };
        successMessage = `${leadIdsToUpdate.length} leads tiveram o nicho alterado para "${value}".`;
        break;
      case 'set_followup':
        updateData = { proximo_followup: value };
        successMessage = `${leadIdsToUpdate.length} leads tiveram o próximo follow-up definido para ${format(value, 'dd/MM/yyyy')}.`;
        break;
      default:
        return;
    }
  
    performAction({
      message: successMessage,
      action: async () => {
        const { error } = await supabase.from('leads').update(updateData).in('id', leadIdsToUpdate);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
      undoAction: async () => {
        showError("Ação de desfazer para esta operação em massa não está implementada.");
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  
    setIsBulkActionModalOpen(false);
    setCurrentBulkAction(null);
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro:</strong> {error}</div>;
    if (leads.length === 0 && !isFiltered) {
      return <EmptyState icon={<Users className="w-12 h-12" />} title="Nenhum lead encontrado" description="Adicione seu primeiro lead para visualizá-lo aqui." cta={canManage ? { text: "Novo Lead", onClick: () => navigate('/admin/leads/novo') } : undefined} />;
    }
    return <LeadsDataTable table={table} />;
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Ações em Massa</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openBulkActionDialog('assign_owner')}><User className="w-4 h-4 mr-2" />Atribuir Responsável...</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openBulkActionDialog('change_status')}><Activity className="w-4 h-4 mr-2" />Alterar Status...</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openBulkActionDialog('change_niche')}><Tag className="w-4 h-4 mr-2" />Alterar Nicho...</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openBulkActionDialog('set_followup')}><Calendar className="w-4 h-4 mr-2" />Definir Follow-up...</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteFilteredAlertOpen(true)} disabled={leads.length === 0} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Leads...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsImportModalOpen(true)} variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button>
            <Button onClick={() => navigate('/admin/leads/novo')}><PlusCircle className="w-4 h-4 mr-2" />Novo Lead</Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-end">
        <SavedFiltersManager pageKey="leads" currentFilters={columnFilters} onApplyFilter={setColumnFilters} onClearFilters={() => { setColumnFilters([]); setDateRange(undefined); }} />
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

      <AlertDialog open={isDeleteFilteredAlertOpen} onOpenChange={setIsDeleteFilteredAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              {isFiltered
                ? `Tem certeza que deseja excluir permanentemente os ${filteredLeads.length} leads que correspondem aos filtros aplicados?`
                : `Você está prestes a excluir TODOS os ${leads.length} leads do sistema. Tem certeza?`
              }
              <br />
              <strong>Esta ação não pode ser desfeita facilmente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteFiltered} className="bg-destructive hover:bg-destructive/90">
              Sim, excluir {isFiltered ? filteredLeads.length : leads.length} leads
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionDialog
        isOpen={isBulkActionModalOpen}
        onClose={() => setIsBulkActionModalOpen(false)}
        actionType={currentBulkAction}
        leadCount={filteredLeads.length}
        onConfirm={handleConfirmBulkAction}
        users={users}
        statusOptions={statusOptions}
        nichoOptions={NICHOS.map(n => ({ value: n, label: n }))}
      />
    </div>
  );
};

export default LeadsPage;