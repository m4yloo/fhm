import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/lib/types";

const PAGE_SIZE = 1000;

async function fetchAllGames(): Promise<Game[]> {
  const all: Game[] = [];
  let from = 0;
  let page: Game[] | null;

  do {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    page = data as Game[];
    all.push(...page);
    from += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);

  return all;
}

export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: fetchAllGames,
  });
}
