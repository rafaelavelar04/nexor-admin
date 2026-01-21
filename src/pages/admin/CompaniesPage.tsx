import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getColumns, Company } from '@/components/companies/CompaniesTableColumns';
import { CompaniesDataTable } from '@/components/companies/CompaniesDataTable';
import { Loader2, PlusCircle, Building } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { RowSelectionState, ColumnFiltersState } from '@tanstack/react-table';

const CompaniesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data: companies, isLoading, isError } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Empresa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      showError(`Erro ao excluir empresa: ${error.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa? Todas os leads associados perderão o vínculo.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(() => getColumns(handleDelete, profile?.role), [profile?.role]);
  const canManage = profile?.role === 'admin' || profile?.role === 'vendas';

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar as empresas.</div>;
    }
    if (!companies || companies.length === 0) {
      return (
        <EmptyState
          icon={<Building className="w-12 h-12" />}
          title="Nenhuma empresa cadastrada"
          description="Cadastre empresas para associá-las a leads e oportunidades, centralizando as informações."
          cta={canManage ? { text: "Nova Empresa", onClick: () => navigate('/admin/companies/novo') } : undefined}
        />
      );
    }
    return <CompaniesDataTable columns={columns} data={companies} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua base de contas e clientes.</p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/admin/companies/novo')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default CompaniesPage;