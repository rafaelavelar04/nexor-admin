import { createContext, useContext, useEffect, useState } from "react";
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

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        full_name,
        avatar_url,
        user_roles (
          roles ( name )
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // Throw the error to be caught by the calling function's catch block
      throw error;
    }

    if (data) {
      const roles = data.user_roles.map((ur: any) => ur.roles.name);
      setProfile({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        roles: roles,
      });
    } else {
      // This case might happen if a user exists in auth but not in profiles
      setProfile(null);
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        // Clear state on error
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // This will always run, ensuring the loading spinner is removed
        setLoading(false);
      }
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // We don't want a full-page loader on every auth change, 
        // but we can handle profile fetching in the background.
        try {
          await fetchProfile(session.user);
        } catch (error) {
          // Error is already logged in fetchProfile, just clear the profile
          setProfile(null);
        }
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