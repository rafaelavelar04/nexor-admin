import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, ShieldAlert } from 'lucide-react';
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

const UsersPage = () => {
  const { profile, user: currentUser } = useSession();
  const queryClient = useQueryClient();
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  const { data: users, isLoading, isError, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_email');
      if (error) throw error;
      return data || [];
    },
    enabled: profile?.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Usuário atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-yellow-400 bg-yellow-500/10 p-6 rounded-md">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-white">Acesso Negado</h2>
        <p className="text-center text-yellow-300">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const columns = UsersTableColumns({
    onRoleChange: handleRoleChange,
    onStatusChange: handleStatusChange,
    currentUserId: currentUser?.id || '',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
        <p className="text-muted-foreground mt-1">Gerencie os acessos e permissões da sua equipe.</p>
      </div>

      {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {isError && <div className="text-destructive-foreground bg-destructive/20 p-4 rounded-md border border-destructive/30"><strong>Erro:</strong> {error.message}</div>}
      {users && <DataTable columns={columns} data={users} />}

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
    </div>
  );
};

export default UsersPage;