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
  admin_role?: boolean;
  is_dev?: boolean;
  badge?: string;
  unlimited_access?: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const devBypassRef = useRef(isDevBypassActive());
  const [state, setState] = useState<AuthState>(
    devBypassRef.current
      ? { user: DEV_USER, session: null, profile: DEV_PROFILE, loading: false }
      : { user: null, session: null, profile: null, loading: true },
  );

  const loadProfile = useCallback(async (user: User): Promise<Profile> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    return {
      id: user.id,
      username:
        data?.username ??
        user.user_metadata?.username ??
        user.email?.split("@")[0] ??
        "member",
      created_at: data?.created_at ?? user.created_at,
      admin_role: data?.admin_role ?? false,
    };
  }, []);

  useEffect(() => {
    if (devBypassRef.current) return;

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      if (!session?.user) {
        setState({ user: null, session: null, profile: null, loading: false });
        return;
      }

      try {
        const profile = await loadProfile(session.user);
        if (mounted) {
          setState({ user: session.user, session, profile, loading: false });
        }
      } catch {
        if (mounted) {
          setState({ user: session.user, session, profile: null, loading: false });
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted || devBypassRef.current) return;

        if (!session?.user) {
          setState({ user: null, session: null, profile: null, loading: false });
          return;
        }

        try {
          const profile = await loadProfile(session.user);
          if (mounted) {
            setState({ user: session.user, session, profile, loading: false });
          }
        } catch {
          if (mounted) {
            setState({ user: session.user, session, profile: null, loading: false });
          }
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

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

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    setState((current) => ({ ...current, loading: true }));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    setState((current) => ({ ...current, loading: false }));
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, loading: true }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setState((current) => ({ ...current, loading: false }));
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: "discord" | "google") => {
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(data.url, "oauth popup", `width=${width},height=${height},left=${left},top=${top}`);
  }, []);

  const signOut = useCallback(async () => {
    if (devBypassRef.current) {
      clearDevBypass();
      return;
    }
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, loading: false });
  }, [clearDevBypass]);

  return {
    ...state,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    devBypassSignIn: applyDevBypass,
  };
}
