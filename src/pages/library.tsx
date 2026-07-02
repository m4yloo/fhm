import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_GAMES } from "@/data/games";
import {
  Search,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
  TrendingUp,
  Calendar,
} from "lucide-react";

// Friendly Slovak labels for the raw IGDB genre strings.
export const GENRE_LABELS: Record<string, string> = {
  "Role-playing (RPG)": "RPG",
  Shooter: "Akčné",
  Platform: "Platformovky",
  Puzzle: "Hlavolamy",
  Simulator: "Simulátory",
  Adventure: "Dobrodružstvá",
  "Point-and-click": "Point-and-click",
  Fighting: "Súbojovky",
  Racing: "Závody",
  Music: "Hudba",
  "Hack and slash/Beat 'em up": "Hack & Slash",
  Strategy: "Stratégie",
  Sport: "Šport",
  "Real Time Strategy (RTS)": "RTS",
  Indie: "Indie",
};

// Pre-compute lowercase title/genre index for fast search (built once).
const SEARCH_INDEX = new Map<
  string,
  { id: number; title: string; genre: string; image: string; year: number; rating: string }[]
>();
(() => {
  for (const g of MOCK_GAMES) {
    const letter = g.title[0]?.toLowerCase() || "#";
    const bucket = SEARCH_INDEX.get(letter) || [];
    bucket.push({
      id: g.id,
      title: g.title,
      genre: g.genre,
      image: g.image,
      year: g.year,
      rating: g.rating,
    });
    SEARCH_INDEX.set(letter, bucket);
  }
})();

// A game has a "real" rating if it's not the default 90% placeholder.
const isRealRating = (rating: string) => rating !== "90%";

// Derive available decades from the data (static — computed once at module load).
const ALL_DECADES: number[] = (() => {
  const years = MOCK_GAMES.map((g) => g.year).filter(Boolean);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const decades: number[] = [];
  for (let d = Math.floor(min / 10) * 10; d <= max; d += 10) decades.push(d);
  return decades;
})();

const DECADE_LABELS: Record<number, string> = {
  1980: "80s",
  1990: "90s",
  2000: "2000s",
  2010: "2010s",
  2020: "2020s",
};

// ── Shared carousel card component ──
function CarouselCard({ game, onClick }: { game: (typeof MOCK_GAMES)[number]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`carousel-game-${game.id}`}
      className="group/card relative shrink-0 w-40 sm:w-44 aspect-[3/4] rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-200 snap-start text-left"
    >
      <img
        src={game.image}
        alt={game.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
        <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
        <span className="text-[9px] font-mono text-yellow-300">{game.rating.split(" ")[0]}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-xs font-bold text-white truncate drop-shadow">{game.title}</p>
        <p className="text-[10px] text-white/60 font-mono truncate">{GENRE_LABELS[game.genre] || game.genre}</p>
      </div>
    </button>
  );
}

// ── Scrollable horizontal rail ──
function GameRail({
  title,
  games,
  onPickGame,
}: {
  title: string;
  games: (typeof MOCK_GAMES)[number][];
  onPickGame: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 200);
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (games.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="relative group/carousel">
        <button
          onClick={() => scroll("left")}
          aria-label="Posunúť doľava"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-lg shadow-black/30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {games.map((game) => (
            <CarouselCard key={game.id} game={game} onClick={() => onPickGame(game.id)} />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          aria-label="Posunúť doprava"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-9 h-9 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-lg shadow-black/30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Library() {
  const [selectedGenre, setSelectedGenre] = useState("Všetky");
  const [selectedDecade, setSelectedDecade] = useState("Všetky");
  const [sortBy, setSortBy] = useState<"rating" | "year" | "name" | "newest">("rating");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [broadSearchTerm, setBroadSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setSearchOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 150);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      setBroadSearchTerm(search.trim());
      setSearchOpen(false);
    }
  }, [search]);

  const genres = useMemo(() => {
    const present = Array.from(new Set(MOCK_GAMES.map((g) => g.genre)));
    const labeled = present.map((g) => GENRE_LABELS[g] || g);
    const unique = Array.from(new Set(labeled));
    return ["Všetky", ...unique];
  }, []);

  const labelToRawGenres = (label: string): string[] =>
    Object.entries(GENRE_LABELS)
      .filter(([, lbl]) => lbl === label)
      .map(([raw]) => raw);

  // Step 1: Filter by genre + decade + broad search
  const filtered = useMemo(() => {
    let pool = MOCK_GAMES;

    // Genre filter
    if (selectedGenre !== "Všetky") {
      const rawMatches = labelToRawGenres(selectedGenre);
      pool = pool.filter((g) => rawMatches.includes(g.genre));
    }

    // Decade filter
    if (selectedDecade !== "Všetky") {
      const decade = Number(selectedDecade);
      pool = pool.filter((g) => g.year >= decade && g.year < decade + 10);
    }

    // Broad search filter (partial match on Enter)
    if (broadSearchTerm) {
      const term = broadSearchTerm.toLowerCase();
      pool = pool.filter((g) =>
        g.title.toLowerCase().includes(term) ||
        g.genre.toLowerCase().includes(term) ||
        (GENRE_LABELS[g.genre] || g.genre).toLowerCase().includes(term)
      );
    }

    return pool;
  }, [selectedGenre, selectedDecade, broadSearchTerm]);

  // Step 2: Sort the filtered set
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "rating":
        arr.sort((a, b) => {
          const ra = parseInt(a.rating, 10) || 0;
          const rb = parseInt(b.rating, 10) || 0;
          return rb - ra;
        });
        break;
      case "year":
        arr.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case "name":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
        arr.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  // Pagination: render in batches to keep the DOM light. Reset on filter/sort change.
  const VISIBLE_STEP = 30;
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
  useEffect(() => setVisibleCount(VISIBLE_STEP), [selectedGenre, selectedDecade, sortBy]);
  const visible = sorted.slice(0, visibleCount);

  // Featured banner: a random game from the current filter, picked once per
  // genre selection. It is intentionally excluded from being the first grid
  // card so the spotlight is always something different from card #1.
  const [featured, setFeatured] = useState<typeof MOCK_GAMES[number] | null>(null);
  useEffect(() => {
    const pool = filtered.length > 1 ? filtered.slice(1) : filtered;
    if (pool.length === 0) {
      setFeatured(null);
      return;
    }
    setFeatured(pool[Math.floor(Math.random() * pool.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre]);

  // Search dropdown matches: uses pre-built index + debounced input so
  // keystrokes stay snappy even with 4k+ games.
  const searchMatches = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return [];
    const results: typeof MOCK_GAMES[number][] = [];
    const firstLetter = s[0] || "#";
    const bucket = SEARCH_INDEX.get(firstLetter) || [];
    for (const g of bucket) {
      if (
        g.title.toLowerCase().includes(s) ||
        g.genre.toLowerCase().includes(s) ||
        (GENRE_LABELS[g.genre] || g.genre).toLowerCase().includes(s)
      ) {
        results.push(g as typeof MOCK_GAMES[number]);
        if (results.length >= 8) break;
      }
    }
    if (results.length < 8) {
      for (const g of MOCK_GAMES) {
        if (results.some((r) => r.id === g.id)) continue;
        if (
          g.title.toLowerCase().includes(s) ||
          g.genre.toLowerCase().includes(s) ||
          (GENRE_LABELS[g.genre] || g.genre).toLowerCase().includes(s)
        ) {
          results.push(g);
          if (results.length >= 8) break;
        }
      }
    }
    return results.slice(0, 8);
  }, [debouncedSearch]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  const pickGame = useCallback(
    (id: number) => {
      setSearch("");
      setSearchOpen(false);
      setLocation(`/hra/${id}`);
    },
    [setLocation],
  );


  // ── New & Trending: recent games (2024–2026), sorted by year desc ──
  const newTrending = useMemo(() => {
    return MOCK_GAMES.filter((g) => g.year >= 2024)
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .slice(0, 20);
  }, []);

  return (
    <div className="flex flex-col gap-10">

      {/* ── New & Trending rail ── */}
      <GameRail title="Novinky & Trendy" games={newTrending} onPickGame={pickGame} />

      {/* ── Featured banner ── */}
      {featured && (
        <div
          onClick={() => setLocation(`/hra/${featured.id}`)}
          className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer group"
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {featured.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-white/60 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              {featured.title}
            </h2>
            <p className="text-sm text-white/50 max-w-lg mb-4 hidden sm:block">{featured.description}</p>
            <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-yellow-300">{featured.rating.split(" ")[0]}</span>
              </div>
              <span>·</span>
              <span>{featured.developer}</span>
              <span>·</span>
              <span>{featured.year}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-foreground shrink-0">Katalóg</h2>
          <div className="h-px flex-1 bg-border/40" />

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px] h-8 text-xs font-mono bg-card border-border/60 rounded-lg">
              <ArrowDownUp className="w-3 h-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Hodnotenie</SelectItem>
              <SelectItem value="newest">Najnovšie</SelectItem>
              <SelectItem value="year">Rok vzostupne</SelectItem>
              <SelectItem value="name">Názov A–Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Decade filter */}
          <Select value={selectedDecade} onValueChange={setSelectedDecade}>
            <SelectTrigger className="w-[100px] h-8 text-xs font-mono bg-card border-border/60 rounded-lg">
              <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Všetky">Všetky</SelectItem>
              {ALL_DECADES.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {DECADE_LABELS[d] || `${d}s`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search box with dropdown */}
          <div className="relative w-56" ref={searchBoxRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Hľadať…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setSearchOpen(true)}
              data-testid="input-search"
              className="pl-9 pr-8 bg-card border-border/60 h-8 text-xs font-mono rounded-lg"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setBroadSearchTerm("");
                  setSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Dropdown results */}
            {searchOpen && search.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {searchMatches.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <Search className="w-4 h-4 text-muted-foreground/40 mx-auto mb-1.5" />
                    <p className="text-[11px] font-mono text-muted-foreground">Žiadne výsledky.</p>
                    <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">Skúste iný výraz.</p>
                  </div>
                ) : (
                  searchMatches.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => pickGame(g.id)}
                      data-testid={`search-result-${g.id}`}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <img
                        src={g.image}
                        alt=""
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">{g.title}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          {GENRE_LABELS[g.genre] || g.genre} · {g.year}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-yellow-300 shrink-0">
                        {g.rating.split(" ")[0]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedGenre === g
                  ? "bg-primary text-white"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground font-mono">
            {filtered.length} hier
          </span>
        </div>
      </div>

      {/* ── Empty ── */}
      {sorted.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm font-mono border border-dashed border-border/40 rounded-xl">
          <Search className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
          <p>Žiadne výsledky.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Skúste zmeniť filter alebo vyhľadávací výraz.</p>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
        {visible.map((game) => (
          <div
            key={game.id}
            data-testid={`card-game-${game.id}`}
            className="group cursor-pointer"
            onClick={() => setLocation(`/hra/${game.id}`)}
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all duration-200 mb-2.5 group-hover:shadow-lg group-hover:shadow-primary/8">
              <img
                src={game.image}
                alt={game.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  game.available ? "" : "grayscale opacity-30"
                }`}
              />
              {!game.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground bg-card/90 border border-border/50 px-2.5 py-1 rounded">Nedostupné</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                <span className="text-[9px] font-mono text-yellow-300">{game.rating.split(" ")[0]}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{game.title}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{GENRE_LABELS[game.genre] || game.genre} · {game.year}</p>
          </div>
        ))}
      </div>

      {/* ── Load more ── */}
      {visibleCount < sorted.length && (
        <div className="flex flex-col items-center gap-1.5 pt-2">
          <button
            onClick={() => setVisibleCount((c) => c + VISIBLE_STEP)}
            data-testid="button-load-more"
            className="px-5 py-2.5 rounded-lg bg-card border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary transition-all text-xs font-mono uppercase tracking-widest"
          >
            Načítať ďalšie ({sorted.length - visibleCount} zostáva)
          </button>
          <span className="text-[11px] text-muted-foreground font-mono">
            {visibleCount} z {sorted.length}
          </span>
        </div>
      )}
    </div>
  );
}
