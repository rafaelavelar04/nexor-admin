import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, DollarSign, Building, Calendar, FileText, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import { ContractReceivablesTable } from '@/components/finance/ContractReceivablesTable';
import { showSuccess, showError } from '@/utils/toast';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSession } from '@/contexts/SessionContext';

const statusStyles: Record<string, string> = {
  ativo: "bg-green-500/20 text-green-300 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
  finalizado: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const ContractDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const canManage = profile?.role === 'admin';
  const [updatingReceivableId, setUpdatingReceivableId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contractDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .rpc('get_contract_details', { contract_id_param: id })
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: costs, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['contractCosts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('partner_costs')
        .select('*, partner:partners(nome)')
        .eq('contract_id', id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { totalCosts, realMargin } = useMemo(() => {
    if (!data || !costs) return { totalCosts: 0, realMargin: 0 };
    const totalCosts = costs.reduce((sum, cost) => sum + (cost.valor || 0), 0);
    const realMargin = (data.value || 0) - totalCosts;
    return { totalCosts, realMargin };
  }, [data, costs]);

  const receivableStatusMutation = useMutation({
    mutationFn: async ({ receivableId, isPaid }: { receivableId: string, isPaid: boolean }) => {
      const status = isPaid ? 'pago' : 'pendente';
      const paid_at = isPaid ? new Date().toISOString() : null;
      const { error } = await supabase.from('contract_receivables').update({ status, paid_at }).eq('id', receivableId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status da parcela atualizado!");
      queryClient.invalidateQueries({ queryKey: ['contractDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const updateDueDateMutation = useMutation({
    mutationFn: async ({ receivableId, newDate }: { receivableId: string, newDate: Date }) => {
      const { error } = await supabase.from('contract_receivables').update({ due_date: newDate.toISOString().split('T')[0] }).eq('id', receivableId);
      if (error) throw error;
    },
    onMutate: ({ receivableId }) => {
      setUpdatingReceivableId(receivableId);
    },
    onSuccess: () => {
      showSuccess("Data de vencimento atualizada!");
      queryClient.invalidateQueries({ queryKey: ['contractDetail', id] });
    },
    onError: (error: any) => showError(`Erro ao atualizar data: ${error.message}`),
    onSettled: () => {
      setUpdatingReceivableId(null);
    },
  });

  if (isLoading || isLoadingCosts) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError || !data) return <div>Erro ao carregar contrato.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/financeiro')}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Contrato: {data.company?.nome}</CardTitle>
              <CardDescription>Detalhes do contrato e faturamento</CardDescription>
            </div>
            <Badge className={`capitalize ${statusStyles[data.status]}`}>{data.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /><span>{data.company?.nome}</span></div>
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span>{formatCurrency(data.value)} {data.billing_cycle ? `/${data.billing_cycle}` : ''}</span></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Início: {format(new Date(data.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span></div>
          <div className="flex items-center gap-2 col-span-1 md:col-span-3"><FileText className="w-4 h-4 text-muted-foreground" /><span>Pagamento: <span className="capitalize font-medium">{data.tipo_pagamento?.replace('_', ' ')}</span> {data.numero_parcelas ? `em ${data.numero_parcelas}x` : ''}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custos e Margem</CardTitle>
          {canManage && <Button size="sm"><PlusCircle className="w-4 h-4 mr-2" />Adicionar Custo</Button>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div><p className="text-sm text-muted-foreground">Receita Total</p><p className="text-xl font-bold">{formatCurrency(data.value)}</p></div>
            <div><p className="text-sm text-muted-foreground">Custos Totais</p><p className="text-xl font-bold text-red-400">{formatCurrency(totalCosts)}</p></div>
            <div><p className="text-sm text-muted-foreground">Margem Real</p><p className="text-xl font-bold text-green-400">{formatCurrency(realMargin)}</p></div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Parceiro</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {costs && costs.length > 0 ? costs.map(cost => (
                <TableRow key={cost.id}>
                  <TableCell>{cost.partner?.nome}</TableCell>
                  <TableCell>{cost.descricao}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cost.valor)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum custo lançado.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Valores a Receber (Parcelas)</CardTitle></CardHeader>
        <CardContent>
          <ContractReceivablesTable 
            receivables={data.receivables || []} 
            onMarkAsPaid={(receivableId, isPaid) => receivableStatusMutation.mutate({ receivableId, isPaid })}
            isUpdatingStatus={receivableStatusMutation.isPending}
            onUpdateDueDate={(receivableId, newDate) => updateDueDateMutation.mutate({ receivableId, newDate })}
            updatingReceivableId={updatingReceivableId}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractDetailPage;