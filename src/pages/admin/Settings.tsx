import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/contexts/SessionContext";
import ProfileSettings from "@/components/settings/ProfileSettings";
import UserSettings from "@/components/settings/UserSettings";
import SystemSettings from "@/components/settings/SystemSettings";
import { ShieldAlert } from "lucide-react";

const SettingsPage = () => {
  const { profile } = useSession();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu perfil, usuários e as configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="users" disabled={!isAdmin}>Usuários</TabsTrigger>
          <TabsTrigger value="system" disabled={!isAdmin}>Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          {isAdmin ? <UserSettings /> : <AccessDenied />}
        </TabsContent>
        
        <TabsContent value="system" className="mt-6">
          {isAdmin ? <SystemSettings /> : <AccessDenied />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full text-yellow-400 bg-yellow-500/10 p-6 rounded-md mt-6">
    <ShieldAlert className="w-12 h-12 mb-4" />
    <h2 className="text-xl font-bold mb-2 text-white">Acesso Negado</h2>
    <p className="text-center text-yellow-300">Você não tem permissão para acessar esta área.</p>
  </div>
);


export default SettingsPage;