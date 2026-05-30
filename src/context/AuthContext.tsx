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

    try {
      const sb = getSupabase();
      
      // Get the session immediately on mount
      sb.auth.getSession()
        .then(async ({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              const { data, error } = await getSupabase()
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();
              
              if (error) throw error;
              setProfile(data ?? null);
            } catch (e) {
              setProfile(null);
            }
          }

          setLoading(false);
        })
        .catch((e) => {
          setLoading(false);
        });

      // Keep listening for future auth changes
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange(async (event, session) => {
        if (event === "INITIAL_SESSION") return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const { data } = await getSupabase()
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setProfile(data ?? null);
          } catch (e) {
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
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabase().auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
