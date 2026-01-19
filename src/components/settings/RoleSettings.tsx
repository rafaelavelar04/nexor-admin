import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionMatrix } from './PermissionMatrix';
import { PERMISSION_TEMPLATES } from '@/lib/permission-templates';
import { showSuccess, showError } from '@/utils/toast';

type Role = { id: string; name: string; description: string | null };
type Permission = { id: string; name: string; description: string | null };

const RoleSettings = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rolesAndPermissions'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) throw rolesError;
      const { data: permissions, error: permsError } = await supabase.from('permissions').select('*');
      if (permsError) throw permsError;
      const { data: rolePerms, error: rpError } = await supabase.from('role_permissions').select('*');
      if (rpError) throw rpError;
      return { roles, permissions, rolePerms };
    },
  });

  useEffect(() => {
    if (selectedRole && data) {
      const permissionsForRole = data.rolePerms
        .filter(rp => rp.role_id === selectedRole.id)
        .map(rp => data.permissions.find(p => p.id === rp.permission_id)?.name)
        .filter(Boolean) as string[];
      setSelectedPermissions(new Set(permissionsForRole));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [selectedRole, data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedRole && !isCreating) return;

      let roleId = selectedRole?.id;

      // Se estiver criando uma nova role
      if (isCreating) {
        if (!newRoleName.trim()) throw new Error("O nome da função é obrigatório.");
        const { data: newRole, error: createError } = await supabase.from('roles').insert({ name: newRoleName }).select().single();
        if (createError) throw createError;
        roleId = newRole.id;
      }

      if (!roleId) throw new Error("ID da função não encontrado.");

      // Sincronizar permissões
      const permissionMap = new Map(data?.permissions.map(p => [p.name, p.id]));
      const permissionIdsToSet = Array.from(selectedPermissions).map(name => permissionMap.get(name)).filter(Boolean);

      // Remover permissões antigas e inserir as novas
      const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', roleId);
      if (deleteError) throw deleteError;

      if (permissionIdsToSet.length > 0) {
        const relations = permissionIdsToSet.map(pid => ({ role_id: roleId, permission_id: pid }));
        const { error: insertError } = await supabase.from('role_permissions').insert(relations);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      showSuccess(`Função ${isCreating ? 'criada' : 'atualizada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['rolesAndPermissions'] });
      setIsCreating(false);
      setNewRoleName('');
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const handleTemplateChange = (templateName: string) => {
    const templatePermissions = PERMISSION_TEMPLATES[templateName] || [];
    setSelectedPermissions(new Set(templatePermissions));
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funções e Permissões</CardTitle>
        <CardDescription>Crie e gerencie as funções de usuário e suas permissões de acesso no sistema.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold">Funções</h3>
          {data?.roles.map(role => (
            <Button key={role.id} variant={selectedRole?.id === role.id ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setIsCreating(false); setSelectedRole(role); }}>
              {role.name}
            </Button>
          ))}
          <Button variant={isCreating ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setSelectedRole(null); setIsCreating(true); setNewRoleName(''); setSelectedPermissions(new Set()); }}>
            <PlusCircle className="w-4 h-4 mr-2" /> Criar Nova Função
          </Button>
        </div>
        <div className="md:col-span-3">
          {!selectedRole && !isCreating && <div className="flex items-center justify-center h-full text-muted-foreground">Selecione uma função para editar ou crie uma nova.</div>}
          {(selectedRole || isCreating) && (
            <div className="space-y-4">
              {isCreating ? (
                <div className="space-y-2">
                  <Input placeholder="Nome da nova função" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                  <Select onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue placeholder="Ou comece com um modelo..." /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(PERMISSION_TEMPLATES).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <h3 className="text-lg font-bold">{selectedRole?.name}</h3>
              )}
              <PermissionMatrix
                allPermissions={data?.permissions || []}
                selectedPermissions={selectedPermissions}
                onSelectionChange={setSelectedPermissions}
              />
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSettings;