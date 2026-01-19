import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

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
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nexor-session-id');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('nexor-session-id');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('full_name, avatar_url, role, active')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            showError("Não foi possível carregar seu perfil.");
            setProfile(null);
          } else {
            setProfile(data);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

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
          showError("Sua sessão foi revogada e você foi desconectado.");
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
      heartbeatInterval = setInterval(sendHeartbeat, 3 * 60 * 1000); // A cada 3 minutos
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [user]);

  const value = { session, user, profile, loading, logout };

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