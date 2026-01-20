import { useSession } from "@/contexts/SessionContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const FullScreenLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <img src="/branding/Nexor SF.png" alt="Nexor Logo" className="mx-auto h-auto w-[200px] md:w-[260px] mb-6" />
    <div className="flex items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-muted-foreground">Carregando sua sessão...</p>
    </div>
  </div>
);

const Index = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (session) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;