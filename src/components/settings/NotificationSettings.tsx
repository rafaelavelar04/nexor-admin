import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { showSuccess, showError } from '@/utils/toast';

type AlertRule = { id: string; module: string; name: string; description: string; };
type NotificationPreference = { alert_rule_id: string; in_app_enabled: boolean; email_enabled: boolean; };

const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notificationSettings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: rules, error: rulesError } = await supabase.from('alert_rules').select('*').order('module');
      if (rulesError) throw rulesError;

      const { data: preferences, error: prefsError } = await supabase.from('user_notification_preferences').select('*').eq('user_id', user.id);
      if (prefsError) throw prefsError;

      return { rules, preferences };
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async ({ ruleId, channel, enabled }: { ruleId: string; channel: 'in_app' | 'email'; enabled: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      const updateData = channel === 'in_app' ? { in_app_enabled: enabled } : { email_enabled: enabled };

      const { error } = await supabase.from('user_notification_preferences').upsert(
        { user_id: user.id, alert_rule_id: ruleId, ...updateData },
        { onConflict: 'user_id,alert_rule_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Preferência atualizada.");
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', user?.id] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-destructive">Erro ao carregar as configurações de notificação.</div>;

  const preferencesMap = new Map(data?.preferences.map(p => [p.alert_rule_id, p]));
  const rulesByModule = data?.rules.reduce((acc, rule) => {
    if (!acc[rule.module]) acc[rule.module] = [];
    acc[rule.module].push(rule);
    return acc;
  }, {} as Record<string, AlertRule[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências de Notificação</CardTitle>
        <CardDescription>Gerencie como e quando você recebe alertas do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={Object.keys(rulesByModule || {})}>
          {rulesByModule && Object.entries(rulesByModule).map(([moduleName, rules]) => (
            <AccordionItem key={moduleName} value={moduleName}>
              <AccordionTrigger className="text-lg font-semibold">{moduleName}</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {rules.map(rule => {
                  const preference = preferencesMap.get(rule.id);
                  const inAppEnabled = preference?.in_app_enabled ?? true;
                  const emailEnabled = preference?.email_enabled ?? true;

                  return (
                    <div key={rule.id} className="p-4 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`in-app-${rule.id}`}
                            checked={inAppEnabled}
                            onCheckedChange={(checked) => mutation.mutate({ ruleId: rule.id, channel: 'in_app', enabled: checked })}
                          />
                          <Label htmlFor={`in-app-${rule.id}`}>No App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`email-${rule.id}`}
                            checked={emailEnabled}
                            onCheckedChange={(checked) => mutation.mutate({ ruleId: rule.id, channel: 'email', enabled: checked })}
                          />
                          <Label htmlFor={`email-${rule.id}`}>Email</Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;