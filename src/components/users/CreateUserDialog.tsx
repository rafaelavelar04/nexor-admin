import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionMatrix } from '@/components/settings/PermissionMatrix';

const createUserSchema = z.object({
  full_name: z.string().min(3, { message: "O nome completo é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  role: z.string().min(1, { message: "Selecione uma função." }),
  creationType: z.enum(['invite', 'password']),
  password: z.string().optional(),
  custom_permissions: z.array(z.string()).optional(),
}).refine(data => {
  if (data.creationType === 'password' && (!data.password || data.password.length < 8)) {
    return false;
  }
  return true;
}, {
  message: "A senha é obrigatória e deve ter no mínimo 8 caracteres.",
  path: ["password"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const CreateUserDialog = ({ isOpen, onClose, onUserCreated }: CreateUserDialogProps) => {
  const [creationType, setCreationType] = useState<'invite' | 'password'>('invite');
  const [customizePermissions, setCustomizePermissions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
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

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'Vendas',
      creationType: 'invite',
      password: '',
    },
  });

  const selectedRoleName = form.watch('role');

  useEffect(() => {
    if (!permissionsData || !selectedRoleName) return;
    
    const role = permissionsData.roles.find(r => r.name === selectedRoleName);
    if (!role) return;

    const permissionsForRole = permissionsData.rolePerms
        .filter(rp => rp.role_id === role.id)
        .map(rp => permissionsData.permissions.find(p => p.id === rp.permission_id)?.name)
        .filter(Boolean) as string[];
    
    setSelectedPermissions(new Set(permissionsForRole));
  }, [selectedRoleName, permissionsData]);

  const mutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const body: any = {
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          invite: data.creationType === 'invite',
          password: data.password,
      };
      if (customizePermissions && data.custom_permissions) {
          body.permissions = data.custom_permissions;
      }
      const { error } = await supabase.functions.invoke('create-user', { body });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Usuário criado com sucesso!');
      onUserCreated();
      onClose();
      form.reset();
      setCustomizePermissions(false);
    },
    onError: (error: any) => {
      showError(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    const submissionData = { ...data };
    if (customizePermissions) {
        submissionData.custom_permissions = Array.from(selectedPermissions);
    }
    mutation.mutate(submissionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo para adicionar um novo membro à equipe.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {permissionsData?.roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
              <FormControl>
                <Checkbox checked={customizePermissions} onCheckedChange={(checked) => setCustomizePermissions(Boolean(checked))} />
              </FormControl>
              <FormLabel className="font-normal">Personalizar permissões para este usuário</FormLabel>
            </FormItem>

            {customizePermissions && (
              <div className="space-y-2">
                <FormLabel>Permissões Personalizadas</FormLabel>
                {isLoadingPermissions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PermissionMatrix
                    allPermissions={permissionsData?.permissions || []}
                    selectedPermissions={selectedPermissions}
                    onSelectionChange={setSelectedPermissions}
                  />
                )}
              </div>
            )}

            <FormField control={form.control} name="creationType" render={({ field }) => (
              <FormItem className="space-y-3 pt-2"><FormLabel>Método de Criação</FormLabel><FormControl>
                <RadioGroup onValueChange={(value) => { field.onChange(value); setCreationType(value as 'invite' | 'password'); }} defaultValue={field.value} className="flex space-x-4">
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="invite" /></FormControl><FormLabel className="font-normal">Enviar convite</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="password" /></FormControl><FormLabel className="font-normal">Definir senha</FormLabel></FormItem>
                </RadioGroup>
              </FormControl><FormMessage /></FormItem>
            )} />
            {creationType === 'password' && (
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};