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
    console.log("AuthContext: initializing, configured:", isSupabaseConfigured());
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      // Get the session immediately on mount
      getSupabase()
        .auth.getSession()
        .then(async ({ data: { session } }) => {
          console.log("AuthContext: getSession resolved, session exists:", !!session);
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              console.log("AuthContext: fetching profile for user:", session.user.id);
              const { data, error } = await getSupabase()
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();
              
              if (error) {
                console.error("AuthContext: profile fetch returned error:", error);
                throw error;
              }
              console.log("AuthContext: profile fetch successful");
              setProfile(data ?? null);
            } catch (e) {
              console.error("AuthContext: Profile fetch error (likely table empty):", e);
              setProfile(null);
            }
          }

          // Auth + profile both settled — clear loading
          console.log("AuthContext: settled from getSession");
          setLoading(false);
        })
        .catch((e) => {
          console.error("AuthContext: Session fetch error:", e);
          setLoading(false);
        });

      // Keep listening for future auth changes
      const {
        data: { subscription },
      } = getSupabase().auth.onAuthStateChange(async (event, session) => {
        console.log("AuthContext: onAuthStateChange event:", event);
        // INITIAL_SESSION is handled by getSession() above; skip it here
        if (event === "INITIAL_SESSION") return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            console.log("AuthContext: fetching profile on change for user:", session.user.id);
            const { data } = await getSupabase()
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setProfile(data ?? null);
          } catch (e) {
            console.error("AuthContext: Profile fetch error on change:", e);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }

        console.log("AuthContext: settled from onAuthStateChange");
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (e) {
      console.error("AuthContext: Auth setup error:", e);
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
