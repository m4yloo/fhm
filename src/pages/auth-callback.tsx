import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        window.close();
      });
    } else {
      // No code — just close
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0d]">
      <div className="text-center space-y-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono">Prihlasujem...</p>
      </div>
    </div>
  );
}
