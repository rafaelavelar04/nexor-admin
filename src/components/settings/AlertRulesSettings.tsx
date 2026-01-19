import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';

type AlertRule = {
  id: string;
  module: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
};

const severityStyles = {
  info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

const AlertRulesSettings = () => {
  const queryClient = useQueryClient();

  const { data: rules, isLoading, isError } = useQuery<AlertRule[]>({
    queryKey: ['alert_rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alert_rules').select('*').order('module');
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('alert_rules').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Regra de alerta atualizada.");
      queryClient.invalidateQueries({ queryKey: ['alert_rules'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-destructive">Erro ao carregar as regras de alerta.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Alerta</CardTitle>
        <CardDescription>Ative ou desative os alertas automáticos do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Severidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => mutation.mutate({ id: rule.id, enabled })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{rule.description}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${severityStyles[rule.severity]}`}>{rule.severity}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertRulesSettings;