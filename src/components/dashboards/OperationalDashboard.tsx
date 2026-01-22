import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, UserX, AlertTriangle, DollarSign } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';

interface OperationalDashboardProps {
  dateRange: DateRange | undefined;
}

const OperationalDashboard = ({ dateRange }: OperationalDashboardProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['operationalDashboardData', dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return null;
      const { data, error } = await supabase.rpc('get_dashboards_data', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return data.operational;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    return <div className="text-destructive mt-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md">Erro ao carregar dados operacionais. Tente atualizar o período.</div>;
  }

  if (!data) {
    return (
      <div className="mt-6">
        <EmptyState icon={<FileText className="w-12 h-12" />} title="Sem dados operacionais" description="Não há dados operacionais para exibir no período selecionado." />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Contratos Ativos" value={data.active_contracts} icon={<FileText />} />
        <KpiCard title="Contratos sem Parceiro" value={data.contracts_without_partner} icon={<UserX />} />
        <KpiCard title="Entregas Atrasadas" value={0} icon={<AlertTriangle />} description="(Em breve)" />
        <KpiCard title="Custos Pendentes" value={data.pending_costs} icon={<DollarSign />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Contratos em Risco (Vencendo em 30 dias)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Vencimento</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.at_risk_contracts?.length > 0 ? data.at_risk_contracts.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell><Link to={`/admin/financeiro/${c.id}`} className="text-primary hover:underline">{c.nome}</Link></TableCell>
                    <TableCell className="text-right">{format(new Date(c.end_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center">Nenhum contrato em risco.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Parceiros Alocados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Parceiro</TableHead><TableHead>Cliente</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.allocated_partners?.length > 0 ? data.allocated_partners.map((a: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{a.partner_name}</TableCell>
                    <TableCell><Link to={`/admin/financeiro/${a.contract_id}`} className="text-primary hover:underline">{a.company_name}</Link></TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center">Nenhum parceiro alocado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperationalDashboard;