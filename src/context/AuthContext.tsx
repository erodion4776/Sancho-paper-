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
      // Get the session immediately on mount — this is synchronous from cache
      // and avoids the delay of waiting for onAuthStateChange INITIAL_SESSION
      getSupabase()
        .auth.getSession()
        .then(async ({ data: { session } }) => {
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
              console.error("Profile fetch error:", e);
              setProfile(null);
            }
          }

          // Auth + profile both settled — clear loading
          setLoading(false);
        })
        .catch((e) => {
          console.error("Session fetch error:", e);
          setLoading(false);
        });

      // Keep listening for future auth changes (login, logout, token refresh)
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange(async (event, session) => {
        // INITIAL_SESSION is handled by getSession() above; skip it here
        // to avoid a double profile fetch on mount
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
            console.error("Profile fetch error:", e);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (e) {
      console.error("Auth setup error:", e);
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
