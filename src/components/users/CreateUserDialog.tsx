import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const createUserSchema = z.object({
  full_name: z.string().min(3, { message: "O nome completo é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  role: z.string().min(1, { message: "Selecione uma permissão." }),
  creationType: z.enum(['invite', 'password']),
  password: z.string().optional(),
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

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'viewer',
      creationType: 'invite',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          invite: data.creationType === 'invite',
          password: data.password,
        },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Usuário criado com sucesso!');
      onUserCreated();
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      showError(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo para adicionar um novo membro à equipe.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Permissão</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="operacoes">Operações</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="creationType" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Método de Criação</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCreationType(value as 'invite' | 'password');
                    }}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl><RadioGroupItem value="invite" /></FormControl>
                      <FormLabel className="font-normal">Enviar convite por email</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl><RadioGroupItem value="password" /></FormControl>
                      <FormLabel className="font-normal">Definir senha</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {creationType === 'password' && (
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
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