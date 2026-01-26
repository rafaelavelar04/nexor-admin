import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { ConvertLeadModal } from '@/components/leads/ConvertLeadModal';
import { LeadImportDialog } from '@/components/leads/LeadImportDialog';
import { BulkActionBar } from '@/components/leads/BulkActionBar';
import { Loader2, Users, Upload, Trash2, SlidersHorizontal, Search } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { RowSelectionState, useReactTable, getCoreRowModel, getSortedRowModel, SortingState, ColumnVisibilityState, PaginationState } from '@tanstack/react-table';
import { exportToCsv } from '@/lib/exportUtils';
import { SavedFiltersManager } from '@/components/common/SavedFiltersManager';
import { useActionManager } from '@/contexts/ActionManagerContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BulkActionDialog, BulkActionType } from '@/components/leads/BulkActionDialog';
import { BulkDeleteDialog } from '@/components/leads/BulkDeleteDialog';
import { format } from 'date-fns';
import useLocalStorage from '@/hooks/useLocalStorage';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { NICHOS } from '@/lib/constants';
import { DataTablePagination } from '@/components/common/DataTablePagination';

const LeadsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, profile } = useSession();
  const { performAction } = useActionManager();

  const [filters, setFilters] = useLocalStorage<any>('leads-filters', {});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedFilters = useDebounce(filters, 500);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType | null>(null);
  const [columnVisibility, setColumnVisibility] = useLocalStorage<ColumnVisibilityState>('leads-column-visibility', {
    'instagram_empresa': false, 'nicho': false, 'site_empresa': false, 'responsavel': false,
  });

  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await supabase.from('profiles').select('id, full_name')).data || [],
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await supabase.from('tags').select('id, nome')).data?.map(t => ({ value: t.id, label: t.nome, nome: t.nome })) || [],
  });

  const { data: nichoOptions = [] } = useQuery({
    queryKey: ['distinctNichos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('nicho');
      if (error) throw error;
      const dynamicNichos = data.map(item => item.nicho).filter(Boolean);
      const allNichos = [...new Set([...NICHOS, ...dynamicNichos])].sort();
      return allNichos.map(n => ({ value: n, label: n, nome: n }));
    },
  });

  const {
    data,
    error,
    isFetching,
    isLoading,
    status,
  } = useQuery({
    queryKey: ['leads', debouncedFilters, sorting, debouncedSearchTerm, pagination],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`*, responsavel:profiles(full_name), tags(id, nome)`, { count: 'exact' })
        .order(sorting[0]?.id || 'created_at', { ascending: !(sorting[0]?.desc ?? true) })
        .range(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize - 1);

      if (debouncedSearchTerm) {
        query = query.or(`nome.ilike.%${debouncedSearchTerm}%,empresa.ilike.%${debouncedSearchTerm}%,nicho.ilike.%${debouncedSearchTerm}%`);
      }

      if (debouncedFilters.status?.length) query = query.in('status', debouncedFilters.status);
      if (debouncedFilters.nicho?.length) query = query.in('nicho', debouncedFilters.nicho);
      if (debouncedFilters.responsavel_id?.length) query = query.in('responsavel_id', debouncedFilters.responsavel_id);
      if (debouncedFilters.cidade) query = query.ilike('cidade', `%${debouncedFilters.cidade}%`);
      if (debouncedFilters.canal) query = query.ilike('canal', `%${debouncedFilters.canal}%`);
      if (debouncedFilters.created_at?.from) query = query.gte('created_at', format(debouncedFilters.created_at.from, 'yyyy-MM-dd'));
      if (debouncedFilters.created_at?.to) query = query.lte('created_at', format(debouncedFilters.created_at.to, 'yyyy-MM-dd'));
      if (debouncedFilters.proximo_followup?.from) query = query.gte('proximo_followup', format(debouncedFilters.proximo_followup.from, 'yyyy-MM-dd'));
      if (debouncedFilters.proximo_followup?.to) query = query.lte('proximo_followup', format(debouncedFilters.proximo_followup.to, 'yyyy-MM-dd'));
      if (debouncedFilters.sem_followup) query = query.is('proximo_followup', null);
      if (debouncedFilters.followup_atrasado) query = query.lt('proximo_followup', format(new Date(), 'yyyy-MM-dd'));
      if (debouncedFilters.meus_leads && user) query = query.eq('responsavel_id', user.id);
      if (debouncedFilters.sem_responsavel) query = query.is('responsavel_id', null);
      if (debouncedFilters.convertidos) query = query.eq('status', 'Convertido');
      if (debouncedFilters.nao_convertidos) query = query.neq('status', 'Convertido');
      
      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  const leads = useMemo(() => data?.data ?? [], [data]);
  const pageCount = useMemo(() => {
    return data?.count ? Math.ceil(data.count / pagination.pageSize) : 0;
  }, [data?.count, pagination.pageSize]);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    const oldStatus = leads.find(l => l.id === leadId)?.status;
    
    queryClient.setQueryData(['leads', debouncedFilters, sorting, pagination], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((lead: Lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ),
      };
    });

    performAction({
      message: `Status do lead alterado para "${newStatus}".`,
      action: async () => {
        const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
        if (error) throw error;
      },
      undoAction: async () => {
        const { error } = await supabase.from('leads').update({ status: oldStatus }).eq('id', leadId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      },
    });
  };

  const handleDelete = (id: string) => { /* ... */ };
  const handleConvert = (lead: Lead) => { setSelectedLead(lead); setIsConvertModalOpen(true); };

  const columns = useMemo(() => getColumns(handleDelete, handleConvert, profile?.role, handleStatusChange), [profile?.role]);

  const table = useReactTable({
    data: leads,
    columns,
    pageCount: pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    state: { sorting, rowSelection, columnVisibility, pagination },
  });

  const selectedLeads = useMemo(() => Object.keys(rowSelection).map(index => table.getRowModel().rows[parseInt(index, 10)]?.original).filter(Boolean), [rowSelection, table.getRowModel().rows]);

  const handleBulkDelete = () => { /* ... */ };
  const handleBulkExport = () => { /* ... */ };
  const handleConfirmBulkDelete = (criteria: any, count: number) => { /* ... */ };
  const openBulkActionDialog = (action: BulkActionType) => { /* ... */ };
  const handleConfirmBulkAction = (value: any) => { /* ... */ };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie e qualifique seus contatos de prospecção.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Ações</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}><Upload className="w-4 h-4 mr-2" />Importar Leads...</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsBulkDeleteModalOpen(true)} disabled={leads.length === 0} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir em Massa...</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => navigate('/admin/leads/novo')}><PlusCircle className="w-4 h-4 mr-2" />Novo Lead</Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou nicho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsFiltersOpen(true)}><SlidersHorizontal className="w-4 h-4 mr-2" />Filtros Avançados</Button>
          <SavedFiltersManager pageKey="leads-v2" currentFilters={filters} onApplyFilter={setFilters} onClearFilters={() => setFilters({})} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : status === 'error' ? (
        <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro:</strong> {error.message}</div>
      ) : leads.length === 0 && !isFetching ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="Nenhum lead encontrado" description="Nenhum lead corresponde aos filtros aplicados ou a base está vazia." cta={canManage ? { text: "Criar Novo Lead", onClick: () => navigate('/admin/leads/novo') } : undefined} />
      ) : (
        <>
          <LeadsDataTable table={table} />
          <DataTablePagination table={table} />
        </>
      )}

      {canManage && <BulkActionBar selectedCount={selectedLeads.length} onTriggerAction={openBulkActionDialog} onExport={handleBulkExport} onDelete={handleBulkDelete} />}
      
      <LeadFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} filters={filters} setFilters={setFilters} users={users} allTags={allTags} nichoOptions={nichoOptions} />
      <ConvertLeadModal isOpen={isConvertModalOpen} onClose={() => { setIsConvertModalOpen(false); setSelectedLead(null); }} leadId={selectedLead?.id || null} leadName={selectedLead?.nome || null} />
      <LeadImportDialog isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <BulkDeleteDialog isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={handleConfirmBulkDelete} users={users} nichoOptions={nichoOptions.map(n => n.value)} />
      <BulkActionDialog isOpen={isBulkActionModalOpen} onClose={() => setIsBulkActionModalOpen(false)} actionType={currentBulkAction} leadCount={selectedLeads.length} onConfirm={handleConfirmBulkAction} users={users} statusOptions={["Não contatado", "Primeiro contato feito", "Sem resposta", "Em conversa", "Follow-up agendado", "Não interessado", "Convertido"]} nichoOptions={nichoOptions} />
    </div>
  );
};

export default LeadsPage;