import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/contexts/SessionContext";
import ProfileSettings from "@/components/settings/ProfileSettings";
import UserSettings from "@/components/settings/UserSettings";
import SystemSettings from "@/components/settings/SystemSettings";
import AuditLogSettings from "@/components/settings/AuditLogSettings";
import WebhookSettings from "@/components/settings/WebhookSettings";
import ActiveSessionsSettings from "@/components/settings/ActiveSessionsSettings";
import RoleSettings from "@/components/settings/RoleSettings";
import AlertRulesSettings from "@/components/settings/AlertRulesSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PlaybookSettings from "@/components/settings/PlaybookSettings";
import { ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const SettingsPage = () => {
  const { profile } = useSession();
  const isAdmin = profile?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu perfil, usuários e as configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={(tab) => setSearchParams({ tab })} className="w-full">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="justify-start">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="users" disabled={!isAdmin}>Usuários</TabsTrigger>
            <TabsTrigger value="roles" disabled={!isAdmin}>Permissões</TabsTrigger>
            <TabsTrigger value="playbooks" disabled={!isAdmin}>Playbooks</TabsTrigger>
            <TabsTrigger value="sessions" disabled={!isAdmin}>Sessões</TabsTrigger>
            <TabsTrigger value="alerts" disabled={!isAdmin}>Alertas</TabsTrigger>
            <TabsTrigger value="system" disabled={!isAdmin}>Sistema</TabsTrigger>
            <TabsTrigger value="audit" disabled={!isAdmin}>Auditoria</TabsTrigger>
            <TabsTrigger value="webhooks" disabled={!isAdmin}>Webhooks</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          {isAdmin ? <UserSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          {isAdmin ? <RoleSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="playbooks" className="mt-6">
          {isAdmin ? <PlaybookSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {isAdmin ? <ActiveSessionsSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          {isAdmin ? <AlertRulesSettings /> : <AccessDenied />}
        </TabsContent>
        
        <TabsContent value="system" className="mt-6">
          {isAdmin ? <SystemSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          {isAdmin ? <AuditLogSettings /> : <AccessDenied />}
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          {isAdmin ? <WebhookSettings /> : <AccessDenied />}
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