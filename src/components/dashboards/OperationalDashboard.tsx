import { KpiCard } from '@/components/dashboard/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { FileText, UserX, AlertTriangle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OperationalDashboard = ({ data }: { data: any }) => {
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