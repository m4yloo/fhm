import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/lib/auth-provider";

export function useClaimGame() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: number) => {
      const { data, error } = await supabase.rpc("request_game", {
        p_game_id: gameId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ["activePass", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["userGames", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
