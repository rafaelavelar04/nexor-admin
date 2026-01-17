import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, KeyRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { AvatarCropDialog } from './AvatarCropDialog';

const profileSchema = z.object({
  full_name: z.string().min(3, { message: "O nome completo é obrigatório." }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSettings = () => {
  const { user, profile, loading } = useSession();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name || '',
    },
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { error } = await supabase.from('profiles').update({ full_name: data.full_name }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['sessionProfile'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const passwordResetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Email do usuário não encontrado.");
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    },
    onSuccess: () => showSuccess("Email de redefinição de senha enviado! Verifique sua caixa de entrada."),
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const avatarUpdateMutation = useMutation({
    mutationFn: async (file: File) => {
        if (!user) throw new Error("Usuário não autenticado.");
        if (file.size > 2 * 1024 * 1024) throw new Error("A imagem não pode ter mais de 2MB.");

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData.publicUrl) throw new Error("Não foi possível obter a URL pública do avatar.");

        const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
        if (updateError) throw updateError;
    },
    onSuccess: () => {
        showSuccess("Avatar atualizado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['sessionProfile'] });
        setCropImageSrc(null);
    },
    onError: (error: any) => {
        showError(`Erro ao atualizar avatar: ${error.message}`);
        setCropImageSrc(null);
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result as string | null);
      });
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    avatarUpdateMutation.mutate(croppedFile);
  };

  const onSubmit = (data: ProfileFormData) => profileUpdateMutation.mutate(data);

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Perfil Público</CardTitle>
                <CardDescription>Atualize suas informações pessoais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <AvatarImage src={profile?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="text-2xl">
                      {profile?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg" className="hidden" />
                  <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={avatarUpdateMutation.isPending}>
                      {avatarUpdateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Alterar Avatar
                  </Button>
                </div>
                <FormField control={form.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input value={user?.email || ''} disabled readOnly />
                </FormItem>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={profileUpdateMutation.isPending}>
                  {profileUpdateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Gerencie sua senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => passwordResetMutation.mutate()} disabled={passwordResetMutation.isPending}>
              <KeyRound className="w-4 h-4 mr-2" />
              {passwordResetMutation.isPending ? 'Enviando...' : 'Enviar link para alterar senha'}
            </Button>
          </CardContent>
        </Card>
      </div>
      <AvatarCropDialog
        isOpen={!!cropImageSrc}
        onClose={() => setCropImageSrc(null)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        isCropping={avatarUpdateMutation.isPending}
      />
    </>
  );
};

export default ProfileSettings;