import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertCard, AlertData } from "@/components/alerts/AlertCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2, RefreshCw } from "lucide-react";
import { showSuccess, showError } from '@/utils/toast';

const AlertsPage = () => {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, isError, refetch } = useQuery<AlertData[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, rule:alert_rules(severity, module)')
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Mapeia para o formato esperado pelo AlertCard
      return data.map(a => ({
        id: a.id,
        ruleId: a.rule_id,
        title: a.title,
        description: a.description,
        severity: a.rule.severity as AlertData['severity'],
        module: a.rule.module,
        link: a.link || '#',
        timestamp: a.created_at,
        isRead: a.is_read,
      }));
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async (updates: { id: string } & Partial<AlertData>) => {
      const { id, ...updateData } = updates;
      const { error } = await supabase.from('alerts').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => showError(`Erro ao atualizar alerta: ${error.message}`),
  });

  const markAsRead = (id: string, read: boolean) => {
    updateAlertMutation.mutate({ id, is_read: read });
  };

  const snooze = (id: string, hours: number) => {
    const snoozed_until = new Date();
    snoozed_until.setHours(snoozed_until.getHours() + hours);
    updateAlertMutation.mutate({ id, snoozed_until: snoozed_until.toISOString() });
    showSuccess(`Alerta adiado por ${hours} hora(s).`);
  };

  const archive = (id: string) => {
    updateAlertMutation.mutate({ id, archived: true });
    showSuccess("Alerta arquivado.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Alertas</h1>
          <p className="text-muted-foreground mt-1">Ações e insights importantes para manter seu processo em dia.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : isError ? (
        <div className="text-destructive">Erro ao carregar os alertas.</div>
      ) : !alerts || alerts.length === 0 ? (
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