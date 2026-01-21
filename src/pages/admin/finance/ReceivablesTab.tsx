import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { getReceivablesColumns, Receivable } from '@/components/finance/ReceivablesTableColumns';
import { ReceivablesDataTable } from '@/components/finance/ReceivablesDataTable';
import { showSuccess, showError } from '@/utils/toast';

const ReceivablesTab = () => {
  const queryClient = useQueryClient();

  const { data: receivables, isLoading, isError } = useQuery<Receivable[]>({
    queryKey: ['receivables'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_receivables');
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, isPaid }: { id: string, isPaid: boolean }) => {
      const status = isPaid ? 'pago' : 'pendente';
      const paid_at = isPaid ? new Date().toISOString() : null;
      const { error } = await supabase.from('receivables').update({ status, paid_at }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status do recebível atualizado!");
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const handleMarkAsPaid = (id: string, isPaid: boolean) => {
    mutation.mutate({ id, isPaid });
  };

  const columns = getReceivablesColumns(handleMarkAsPaid);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (isError) {
    return <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30">Erro ao carregar os recebíveis.</div>;
  }
  if (!receivables || receivables.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12" />}
        title="Nenhum valor a receber"
        description="Crie contratos com pagamentos únicos ou parcelados para ver os recebíveis aqui."
      />
    );
  }

  return <ReceivablesDataTable columns={columns} data={receivables} />;
};

export default ReceivablesTab;