import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { getActiveSessionsColumns, ActiveSession, parseUserAgent } from './ActiveSessionsTableColumns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';

const ActiveSessionsSettings = () => {
  const queryClient = useQueryClient();
  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const currentSessionId = localStorage.getItem('nexor-session-id');

  const { data: sessions, isLoading, isError } = useQuery<ActiveSession[]>({
    queryKey: ['active_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*, user:profiles!user_id(full_name, role)')
        .order('last_seen_at', { ascending: false });
      if (error) throw error;
      return data.map(s => ({ ...s, user: Array.isArray(s.user) ? s.user[0] : s.user })) as ActiveSession[];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string, reason: string }) => {
      const { error } = await supabase.functions.invoke('revoke-session', {
        body: {
          target_session_id: sessionId,
          reason: reason,
        },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Sessão revogada com sucesso. O usuário será desconectado em breve.");
      queryClient.invalidateQueries({ queryKey: ['active_sessions'] });
    },
    onError: (error: any) => {
      showError(`Erro ao revogar sessão: ${error.message}`);
    },
    onSettled: () => {
      setSessionToRevoke(null);
      setRevokeReason('');
    },
  });

  const handleRevokeConfirm = () => {
    if (sessionToRevoke) {
      revokeMutation.mutate({ sessionId: sessionToRevoke.session_id, reason: revokeReason });
    }
  };

  const columns = getActiveSessionsColumns(currentSessionId || '', (session) => setSessionToRevoke(session));
  const table = useReactTable({
    data: sessions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (isError) return <div className="text-destructive">Erro ao carregar sessões.</div>;
    if (!sessions || sessions.length === 0) {
      return <EmptyState icon={<Shield className="w-12 h-12" />} title="Nenhuma sessão ativa" description="Quando os usuários fizerem login, suas sessões aparecerão aqui." />;
    }
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
          <CardDescription>Monitore e gerencie todas as sessões de usuários ativas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Derrubar Sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a revogar a sessão de <strong>{sessionToRevoke?.user.full_name}</strong> no dispositivo <strong>{parseUserAgent(sessionToRevoke?.user_agent || '')}</strong>. Isso forçará o logout do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">Motivo (opcional)</label>
            <Input
              id="reason"
              placeholder="Ex: Atividade suspeita"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeConfirm} disabled={revokeMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {revokeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Derrubar Sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActiveSessionsSettings;