import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AuditLog, getAuditLogColumns } from '@/components/audit/AuditLogTableColumns';
import { AuditLogDataTable } from '@/components/audit/AuditLogDataTable';
import { LogDetailDialog } from '@/components/audit/LogDetailDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AuditLogSettings = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const columns = getAuditLogColumns((log) => setSelectedLog(log));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Rastreie todas as ações importantes realizadas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <AuditLogDataTable columns={columns} users={users || []} />
          )}
        </CardContent>
      </Card>
      <LogDetailDialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </>
  );
};

export default AuditLogSettings;