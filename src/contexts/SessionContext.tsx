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
  error: string | null;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nexor-session-id');
    setProfile(null);
    setError(null);
  };

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Falha ao obter a sessão.");
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role, active')
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            // Se o perfil não for encontrado, pode ser um erro de RLS ou o perfil realmente não existe.
            // A mensagem de erro genérica é mais segura.
            throw new Error(profileError.message);
          }
          
          // Se o campo 'active' não existir no retorno, assumimos como true para não bloquear o usuário.
          const userProfile = {
            ...data,
            active: data.active === false ? false : true,
          };
          setProfile(userProfile);

        } catch (e: any) {
          console.error("Erro crítico ao carregar perfil:", e.message);
          setError("Não foi possível carregar seu perfil. As permissões de segurança podem estar impedindo o acesso ou o perfil não foi encontrado.");
          setProfile(null);
        }
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (_event === 'SIGNED_IN') {
        fetchSessionAndProfile();
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setError(null);
        localStorage.removeItem('nexor-session-id');
      } else {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Heartbeat
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
        const { error: invokeError, status } = await supabase.functions.invoke('create-or-update-session', {
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

        if (invokeError) {
          console.error('[SessionContext] Falha no heartbeat:', invokeError.message);
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