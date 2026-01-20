import { useSession } from "@/contexts/SessionContext";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthErrorDisplay = ({ error, onLogout }: { error: string, onLogout: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
    <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
    <h1 className="text-2xl font-bold text-foreground mb-2">Erro de Autenticação</h1>
    <p className="text-muted-foreground max-w-md mb-6">{error}</p>
    <Button onClick={onLogout} variant="destructive">
      Sair e tentar novamente
    </Button>
  </div>
);

const ProtectedRoute = () => {
  const { session, profile, loading, error, logout } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <AuthErrorDisplay error={error} onLogout={logout} />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.active) {
    return <AuthErrorDisplay error="Sua conta de usuário está inativa. Por favor, contate um administrador." onLogout={logout} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;