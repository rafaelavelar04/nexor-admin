import { AlertCard } from "@/components/alerts/AlertCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2, RefreshCw } from "lucide-react";

// Mock data - será substituído pelo hook
const mockAlerts = [
    { id: '1', ruleId: 'lead-stale', title: 'Lead Estagnado', description: 'Lead "Fulano de Tal" não é atualizado há 5 dias.', severity: 'warning', module: 'Leads', link: '/admin/leads', timestamp: new Date().toISOString(), isRead: false },
    { id: '2', ruleId: 'opp-stagnant', title: 'Oportunidade Parada', description: 'Oportunidade "Projeto X" está no mesmo estágio há 10 dias.', severity: 'critical', module: 'Oportunidades', link: '/admin/opportunities', timestamp: new Date().toISOString(), isRead: true },
];

const AlertsPage = () => {
  // Estes estados e funções virão do hook useAlerts
  const alerts = mockAlerts;
  const isLoading = false;
  const refetch = () => alert("Recalculando alertas...");
  const markAsRead = (id: string, read: boolean) => alert(`Marcando alerta ${id} como ${read ? 'lido' : 'não lido'}`);
  const snooze = (id: string, hours: number) => alert(`Adiando alerta ${id} por ${hours} horas`);
  const archive = (id: string) => alert(`Arquivando alerta ${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Alertas</h1>
          <p className="text-muted-foreground mt-1">Ações e insights importantes para manter seu processo em dia.</p>
        </div>
        <Button onClick={refetch} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<BellRing className="w-12 h-12" />}
          title="Tudo em ordem!"
          description="Nenhum alerta no momento. Bom trabalho!"
        />
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onMarkRead={markAsRead}
              onSnooze={snooze}
              onArchive={archive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;