import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';
import { EmptyState } from '@/components/common/EmptyState';

type ImportHistory = {
  id: string;
  filename: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  created_at: string;
  reverted_at: string | null;
  user: { full_name: string } | null;
};

const ImportHistoryPage = () => {
  const queryClient = useQueryClient();
  const [importToRevert, setImportToRevert] = useState<ImportHistory | null>(null);

  const { data: imports, isLoading } = useQuery<ImportHistory[]>({
    queryKey: ['lead_imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_imports')
        .select('*, user:profiles(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(i => ({ ...i, user: Array.isArray(i.user) ? i.user[0] : i.user })) as ImportHistory[];
    },
  });

  const revertMutation = useMutation({
    mutationFn: async (importId: string) => {
      // Deleta os leads associados
      const { error: deleteError } = await supabase.from('leads').delete().eq('import_id', importId);
      if (deleteError) throw deleteError;

      // Marca a importação como revertida
      const { error: updateError } = await supabase.from('lead_imports').update({ reverted_at: new Date().toISOString() }).eq('id', importId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      showSuccess("Importação revertida com sucesso. Os leads foram excluídos.");
      queryClient.invalidateQueries({ queryKey: ['lead_imports'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: any) => showError(`Erro ao reverter: ${error.message}`),
    onSettled: () => setImportToRevert(null),
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações de Leads</CardTitle>
          <CardDescription>Visualize e gerencie todas as importações de leads realizadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!imports || imports.length === 0) ? (
            <EmptyState icon={<UploadCloud className="w-12 h-12" />} title="Nenhuma importação encontrada" description="O histórico de suas importações de planilhas aparecerá aqui." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criados</TableHead>
                    <TableHead>Ignorados</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map(imp => (
                    <TableRow key={imp.id}>
                      <TableCell>{format(new Date(imp.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{imp.filename}</TableCell>
                      <TableCell>
                        {imp.reverted_at ? (
                          <Badge variant="destructive">Revertida</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">Concluída</Badge>
                        )}
                      </TableCell>
                      <TableCell>{imp.success_rows}</TableCell>
                      <TableCell>{imp.error_rows}</TableCell>
                      <TableCell>{imp.user?.full_name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setImportToRevert(imp)}
                          disabled={!!imp.reverted_at || revertMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Reverter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!importToRevert} onOpenChange={() => setImportToRevert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reversão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reverter a importação do arquivo "{importToRevert?.filename}"?
              Esta ação excluirá permanentemente <strong>{importToRevert?.success_rows} leads</strong> criados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => revertMutation.mutate(importToRevert!.id)} disabled={revertMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {revertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sim, reverter importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImportHistoryPage;