import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ContractsDataTable } from '@/components/finance/ContractsDataTable';
import { getColumns, Contract } from '@/components/finance/ContractsTableColumns';
import { ContractFormDialog } from '@/components/finance/ContractFormDialog';
import { formatCurrency } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReceivablesTab from './finance/ReceivablesTab';

const FinancePage = () => {
  const { profile } = useSession();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { data: contracts, isLoading, isError } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contracts');
      if (error) throw error;
      return data || [];
    },
  });

  const { mrr, totalActiveValue } = useMemo(() => {
    if (!contracts) return { mrr: 0, totalActiveValue: 0 };
    const activeContracts = contracts.filter(c => c.status === 'ativo');
    
    const mrr = activeContracts
      .filter(c => c.type === 'recorrente' && c.billing_cycle === 'mensal')
      .reduce((sum, c) => sum + (c.value || 0), 0);

    const totalActiveValue = activeContracts.reduce((sum, c) => sum + (c.value || 0), 0);

    return { mrr, totalActiveValue };
  }, [contracts]);

  const canManage = profile?.role === 'admin';

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedContract(null);
  };

  const columns = getColumns(handleEdit);

  const renderContractsContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    if (isError) {
      return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar os contratos.</div>;
    }
    if (!contracts || contracts.length === 0) {
      return (
        <EmptyState
          icon={<DollarSign className="w-12 h-12" />}
          title="Nenhum contrato encontrado"
          description="Crie o primeiro contrato a partir de uma oportunidade ganha ou manualmente para começar a monitorar sua receita."
          cta={canManage ? { text: "Criar Primeiro Contrato", onClick: () => { setSelectedContract(null); setIsFormOpen(true); } } : undefined}
        />
      );
    }
    return <ContractsDataTable columns={columns} data={contracts} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Gerencie contratos e acompanhe a receita da sua empresa.</p>
        </div>
        {canManage && (
          <Button onClick={() => { setSelectedContract(null); setIsFormOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <KpiCard title="Receita Mensal Recorrente (MRR)" value={formatCurrency(mrr)} icon={<TrendingUp className="h-5 w-5 text-green-400" />} description="Soma dos contratos recorrentes mensais ativos." />
        <KpiCard title="Valor Total Ativo" value={formatCurrency(totalActiveValue)} icon={<DollarSign className="h-5 w-5 text-cyan-400" />} description="Soma de todos os contratos com status 'ativo'." />
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="receivables">Valores a Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="contracts" className="mt-4">
          {renderContractsContent()}
        </TabsContent>
        <TabsContent value="receivables" className="mt-4">
          <ReceivablesTab />
        </TabsContent>
      </Tabs>

      <ContractFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseDialog}
        contract={selectedContract}
      />
    </div>
  );
};

export default FinancePage;