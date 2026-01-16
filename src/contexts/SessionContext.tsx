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

  // Efeito 1: Gerencia a sessão do Supabase (login, logout, refresh)
  useEffect(() => {
    // Pega a sessão inicial para acelerar o carregamento da UI
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[SessionContext] Initial session fetched.");
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Escuta por mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[SessionContext] Auth state changed, event:", _event);
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Limpa a inscrição ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito 2: Busca o perfil do usuário sempre que o 'user' mudar
  useEffect(() => {
    // Se existe um usuário, busca o perfil
    if (user) {
      setLoading(true);
      console.log(`[SessionContext] User detected (${user.id}), fetching profile...`);
      
      supabase
        .from('profiles')
        .select('full_name, avatar_url, role, active')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("[SessionContext] Error fetching profile:", error.message);
            showError("Não foi possível carregar seu perfil.");
            setProfile(null); // Define o perfil como nulo em caso de erro
          } else {
            console.log("[SessionContext] Profile fetched successfully.");
            setProfile(data);
          }
        })
        .finally(() => {
          // Garante que o loading sempre termine, mesmo com erro
          console.log("[SessionContext] Profile fetch flow finished. Loading set to false.");
          setLoading(false);
        });
    } else {
      // Se não há usuário, não há perfil para buscar e o carregamento termina
      console.log("[SessionContext] No user found. Clearing profile and finishing loading.");
      setProfile(null);
      setLoading(false);
    }
  }, [user]); // Este efeito roda apenas quando o objeto 'user' muda

  const logout = async () => {
    await supabase.auth.signOut();
    // O onAuthStateChange cuidará de limpar os estados de session, user e profile.
  };

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
  };

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