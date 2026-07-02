import { useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  DEV_BYPASS_KEY,
  DEV_PROFILE,
  DEV_USER,
  isDevBypassActive,
  type DevProfile,
} from "@/lib/dev-auth";

export interface Profile {
  id: string;
  username: string;
  created_at: string;
  is_dev?: boolean;
  badge?: string;
  unlimited_access?: boolean;
  admin_role?: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const devBypassRef = useRef(isDevBypassActive());
  const [state, setState] = useState<AuthState>(() =>
    devBypassRef.current
      ? { user: DEV_USER, session: null, profile: DEV_PROFILE, loading: false }
      : { user: null, session: null, profile: null, loading: true }
  );

  const applyDevBypass = useCallback(() => {
    if (!import.meta.env.DEV) return;
    sessionStorage.setItem(DEV_BYPASS_KEY, "1");
    devBypassRef.current = true;
    setState({
      user: DEV_USER,
      session: null,
      profile: DEV_PROFILE,
      loading: false,
    });
  }, []);

  const clearDevBypass = useCallback(() => {
    sessionStorage.removeItem(DEV_BYPASS_KEY);
    devBypassRef.current = false;
    setState({ user: null, session: null, profile: null, loading: false });
  }, []);

  // On mount and on every auth change, sync session + profile.
  useEffect(() => {
    if (devBypassRef.current) return;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (devBypassRef.current) return;
        setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }));
      })
      .catch(() => {
        if (devBypassRef.current) return;
        setState((s) => ({ ...s, session: null, user: null, loading: false }));
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (devBypassRef.current) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile whenever user changes.
  useEffect(() => {
    if (!state.user) {
      setState((s) => ({ ...s, profile: null }));
      return;
    }
    if (devBypassRef.current) {
      setState((s) => ({ ...s, profile: DEV_PROFILE }));
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", state.user.id)
      .single()
      .then(({ data }) => {
        setState((s) => ({ ...s, profile: data ?? null }));
      });
  }, [state.user]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: "discord" | "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/kniznica" },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (devBypassRef.current) {
      clearDevBypass();
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [clearDevBypass]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    devBypassSignIn: applyDevBypass,
  };
}
