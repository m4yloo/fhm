import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/lib/auth-provider";

export interface Pass {
  id: string;
  user_id: string;
  pass_type: "limited" | "unlimited";
  status: "active" | "expired" | "cancelled";
  games_allowed: number;
  games_claimed: number;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export function usePass() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["activePass", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_passes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Pass | null;
    },
    enabled: !!user,
  });
}
