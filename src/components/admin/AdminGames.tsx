import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, Star, Gamepad2, ExternalLink } from "lucide-react";
import type { AdminGame } from "./types";

export function AdminGames() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["adminGames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, title, image, rating, genre, platform, year, tags")
        .order("title");
      if (error) throw error;
      return (data ?? []) as AdminGame[];
    },
  });

  const filtered = games.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.platform?.toLowerCase().includes(q) ||
      g.genre?.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const safeRating = (r: string | null): string => {
    if (!r) return "—";
    const num = parseInt(r, 10);
    return isNaN(num) ? "—" : `${num}%`;
  };

  const getRatingColor = (r: string | null): string => {
    if (!r) return "text-gray-400";
    const num = parseInt(r, 10);
    if (isNaN(num)) return "text-gray-400";
    if (num >= 85) return "text-emerald-400";
    if (num >= 70) return "text-yellow-400";
    if (num >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const GENRE_LABELS: Record<string, string> = {
    "Role-playing (RPG)": "RPG",
    Shooter: "Akčné",
    Platform: "Platformovky",
    Puzzle: "Hlavolamy",
    Simulator: "Simulátory",
    Adventure: "Dobrodružstvá",
    Fighting: "Súbojovky",
    Racing: "Závody",
    Music: "Hudba",
    Strategy: "Stratégie",
    Sport: "Šport",
    Indie: "Indie",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Hľadať hru, platformu alebo žáner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 bg-card border-border/60 text-xs font-mono focus-visible:ring-primary rounded-xl"
          />
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">
          {filtered.length} z {games.length} hier
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-mono">
          Žiadne hry.
        </div>
      ) : (
        <>
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-4 py-3 w-12"></th>
                    <th className="text-left px-4 py-3">Názov</th>
                    <th className="text-left px-4 py-3">Platforma</th>
                    <th className="text-left px-4 py-3">Žánre</th>
                    <th className="text-left px-4 py-3">Hodnotenie</th>
                    <th className="text-left px-4 py-3">Dátum</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-border/20 last:border-0 hover:bg-card/50 transition-colors"
                    >
                      <td className="px-4 py-2">
                        {game.image ? (
                          <img
                            src={game.image}
                            alt=""
                            className="w-8 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-10 rounded bg-muted flex items-center justify-center">
                            <Gamepad2 className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground truncate max-w-[250px]">
                          {game.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {game.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {game.platform || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {game.genre ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary/5 text-primary/70 border border-primary/10"
                            >
                              {GENRE_LABELS[game.genre] ?? game.genre}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-bold ${getRatingColor(game.rating)}`}>
                          {safeRating(game.rating)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">
                        {game.year || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                ← Predchádzajúce
              </button>
              <span className="text-[11px] font-mono text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Ďalšie →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
