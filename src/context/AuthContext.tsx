import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Start true — we only set it false when auth + profile are both ready
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const sb = getSupabase();
        
        // Get the session
        const { data: { session } } = await sb.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("AuthContext: Debug - User ID:", session.user.id);
          try {
            const { data, error } = await sb
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (error) {
              console.error("AuthContext: Debug - Profile fetch error:", error);
              // Even if error, we have a session, so profile is null
            } else {
              console.log("AuthContext: Debug - Profile fetched:", data);
              setProfile(data ?? null);
            }
          } catch (e) {
            console.error("AuthContext: Debug - Profile fetch exception:", e);
            setProfile(null);
          }
        }
        
        setLoading(false); // Ensure loading is false after init

        // Listen for future auth changes
        const {
          data: { subscription },
        } = sb.auth.onAuthStateChange(async (event, session) => {
          if (event === "INITIAL_SESSION") return;

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              const { data, error } = await sb
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();
              
              if (error) {
                console.error("AuthContext: Debug - onAuthStateChange Profile fetch error:", error);
              } else {
                setProfile(data ?? null);
              }
            } catch (e) {
              console.error("AuthContext: Debug - onAuthStateChange Profile fetch exception:", e);
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (e) {
        console.error("AuthContext: Auth setup error:", e);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await getSupabase().auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
