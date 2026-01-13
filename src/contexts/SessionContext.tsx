import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  avatar_url: string;
  roles: string[];
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
  const [loading, setLoading] = useState(true); // Start as true, will be set to false once auth state is determined.

  const fetchProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, user_roles(roles(name))')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const roles = data.user_roles.map((ur: any) => ur.roles.name);
        setProfile({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          roles: roles,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null); // Ensure profile is cleared on error
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Get the initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        }
      } catch (error) {
        console.error("Error during initial session fetch:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // 2. ALWAYS set loading to false after the check is complete
        setLoading(false);
      }
    };

    initializeSession();

    // 3. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
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