import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) return 'N/A';
  if (key.includes('valor')) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  return value.toString();
};

const generateChangeMessage = (log: any) => {
  const { action, before_data, after_data } = log;
  const user = log.user?.full_name || 'Sistema';

  if (action === 'create') {
    return `${user} criou a oportunidade.`;
  }

  if (action === 'delete') {
    return `${user} excluiu a oportunidade.`;
  }

  if (action === 'update' && before_data && after_data) {
    const changes = Object.keys(after_data).reduce((acc, key) => {
      if (JSON.stringify(before_data[key]) !== JSON.stringify(after_data[key])) {
        acc.push(`'${key}' de '${formatValue(key, before_data[key])}' para '${formatValue(key, after_data[key])}'`);
      }
      return acc;
    }, [] as string[]);

    if (changes.length > 0) {
      return `${user} atualizou ${changes.join(', ')}.`;
    }
  }

  return `Ação de ${action} por ${user}.`;
};

export const AuditHistory = ({ auditLogs }: { auditLogs: any[] }) => {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum histórico encontrado.</p>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-gray-400">
                    <History className="w-5 h-5" />
                  </span>
                  <div className="flex-grow w-px bg-gray-700"></div>
                </div>
                <div className="pb-6 w-full">
                  <p className="text-sm text-gray-300">{generateChangeMessage(log)}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};