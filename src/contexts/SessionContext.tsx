import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  avatar_url: string;
  role: string | null;
  active: boolean;
}

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null; // Adicionado estado de erro
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Adicionado estado de erro

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nexor-session-id');
    setProfile(null);
    setError(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null); // Limpa o erro em mudança de autenticação
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('nexor-session-id');
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Falha ao obter a sessão.");
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role, active')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            throw new Error(profileError.message);
          }
          setProfile(data);
        } catch (e: any) {
          console.error("Erro crítico ao carregar perfil:", e.message);
          setError("Não foi possível carregar seu perfil. A configuração de segurança pode estar impedindo o acesso.");
          setProfile(null);
        }
      }
      setLoading(false);
    };

    fetchInitialSession();
  }, []);

  // Heartbeat (sem alterações, mas mantido)
  useEffect(() => {
    const SESSION_ID_KEY = 'nexor-session-id';
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    let heartbeatInterval: number | undefined;

    const sendHeartbeat = async () => {
      if (!supabase || !user || !sessionId) return;

      try {
        const { error, status } = await supabase.functions.invoke('create-or-update-session', {
          body: {
            session_id: sessionId,
            user_agent: navigator.userAgent,
          },
        });

        if (status === 401) {
          console.warn('[SessionContext] Sessão revogada por um administrador. Desconectando.');
          setError("Sua sessão foi revogada e você foi desconectado.");
          await logout();
          return;
        }

        if (error) {
          console.error('[SessionContext] Falha no heartbeat:', error.message);
        }
      } catch (e) {
        console.error('[SessionContext] Exceção no heartbeat:', e);
      }
    };

    if (user) {
      sendHeartbeat();
      heartbeatInterval = setInterval(sendHeartbeat, 3 * 60 * 1000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [user]);

  const value = { session, user, profile, loading, error, logout };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};