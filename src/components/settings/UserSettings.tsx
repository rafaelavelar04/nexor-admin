import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { User, UsersTableColumns } from '@/components/users/UsersTableColumns';
import { DataTable } from '@/components/users/UsersDataTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UserSettings = () => {
  const { user: currentUser } = useSession();
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_users_with_email');
      if (rpcError) throw rpcError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      showError(`Erro ao carregar usuários: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Usuário atualizado com sucesso!");
      fetchUsers();
    },
    onError: (err: any) => {
      showError(`Erro ao atualizar usuário: ${err.message}`);
    },
    onSettled: () => {
      setUserToDeactivate(null);
    }
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserMutation.mutate({ userId, updates: { role: newRole } });
  };

  const handleStatusChange = (user: User, newStatus: boolean) => {
    if (!newStatus) {
      setUserToDeactivate(user);
    } else {
      updateUserMutation.mutate({ userId: user.id, updates: { active: true } });
    }
  };

  const confirmDeactivation = () => {
    if (userToDeactivate) {
      updateUserMutation.mutate({ userId: userToDeactivate.id, updates: { active: false } });
    }
  };

  const columns = UsersTableColumns({
    onRoleChange: handleRoleChange,
    onStatusChange: handleStatusChange,
    currentUserId: currentUser?.id || '',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>Gerencie os acessos e permissões da sua equipe.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
        {error && <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro:</strong> {error}</div>}
        {!isLoading && !error && <DataTable columns={columns} data={users} />}

        <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar o usuário "{userToDeactivate?.full_name}"? Ele perderá o acesso ao sistema imediatamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeactivation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default UserSettings;