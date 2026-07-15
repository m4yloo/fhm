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
import { useGames } from "@/hooks/useGames";
import { LibrarySkeleton } from "@/components/skeletons";
import {
  Search,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp,
  Filter,
} from "lucide-react";
import { useEffect as useReactEffect } from "react";

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


// Safe accessors — guard against null/undefined fields from Supabase.
const safeTags = (tags: any): string[] => Array.isArray(tags) ? tags : [];
const safeStr = (v: any): string => (typeof v === "string" ? v : "");
const safeNum = (v: any): number => (typeof v === "number" ? v : 0);
const safeRating = (v: any): string => {
  const s = typeof v === "string" ? v : "";
  const num = parseInt(s, 10);
  return isNaN(num) ? "—" : `${num}%`;
};

// Get color class based on rating percentage
const getRatingColor = (rating: string): string => {
  const num = parseInt(rating, 10);
  if (isNaN(num)) return "text-gray-400";
  if (num >= 85) return "text-emerald-400";
  if (num >= 70) return "text-yellow-400";
  if (num >= 50) return "text-orange-400";
  return "text-red-400";
};

const DECADE_LABELS: Record<number, string> = {
  1980: "80s",
  1990: "90s",
  2000: "2000s",
  2010: "2010s",
  2020: "2020s",
};

// ── Shared carousel card component ──
function CarouselCard({ game, onClick }: { game: any; onClick: () => void }) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
        <Star className={`w-2.5 h-2.5 ${getRatingColor(game.rating)} fill-current`} />
        <span className={`text-[9px] font-mono ${getRatingColor(game.rating)}`}>{safeRating(game.rating)}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-xs font-bold text-white truncate drop-shadow">{safeStr(game.title)}</p>
        <p className="text-[10px] text-white/60 font-mono truncate">{GENRE_LABELS[game.genre] || game.genre}</p>
      </div>
    </button>
  );
}

// ── Scrollable horizontal rail with auto-scroll ──
function GameRail({
  title,
  games,
  onPickGame,
  autoScroll = false,
}: {
  title: string;
  games: any[];
  onPickGame: (id: number) => void;
  autoScroll?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, games.length]);

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll) return;
    const el = ref.current;
    if (!el) return;

    let raf: number;
    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += 0.5;
        // Loop back to start when reaching end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 5) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 250);
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (games.length === 0) return null;

  return (
    <div
      className="relative group/rail"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll("left")}
              aria-label="Posunúť doľava"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-lg shadow-black/30 opacity-0 group-hover/rail:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {games.map((game) => (
            <CarouselCard key={game.id} game={game} onClick={() => onPickGame(game.id)} />
          ))}
        </div>

        {/* Right fade + arrow */}
        {canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll("right")}
              aria-label="Posunúť doprava"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-9 h-9 rounded-full bg-card/95 backdrop-blur-sm border border-border/60 text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-lg shadow-black/30 opacity-0 group-hover/rail:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Library() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useGames();
  const games = data?.pages?.flat() ?? [];
  const [selectedGenre, setSelectedGenre] = useState("Všetky");
  const [selectedDecade, setSelectedDecade] = useState("Všetky");
  const [sortBy, setSortBy] = useState<"rating" | "year" | "name" | "newest" | "shuffle">("newest");
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

  // ── All hooks are declared here, before any conditional returns ──

  const genres = useMemo(() => {
    const present = Array.from(new Set(games.map((g: any) => safeStr(g.genre))));
    const labeled = present.map((g: string) => GENRE_LABELS[g] || g);
    const unique = Array.from(new Set(labeled));
    return ["Všetky", ...unique];
  }, [games]);

  const labelToRawGenres = (label: string): string[] =>
    Object.entries(GENRE_LABELS)
      .filter(([, lbl]) => lbl === label)
      .map(([raw]) => raw);

  // Derive available decades from the data
  const ALL_DECADES = useMemo(() => {
    const years = games.map((g: any) => safeNum(g.year)).filter(Boolean);
    if (years.length === 0) return [];
    const min = Math.min(...years);
    const max = Math.max(...years);
    const decades: number[] = [];
    for (let d = Math.floor(min / 10) * 10; d <= max; d += 10) decades.push(d);
    return decades;
  }, [games]);

  // Step 1: Filter by genre + decade + broad search
  const filtered = useMemo(() => {
    let pool = games;

    // Genre filter
    if (selectedGenre !== "Všetky") {
      const rawMatches = labelToRawGenres(selectedGenre);
      pool = pool.filter((g: any) => rawMatches.includes(safeStr(g.genre)));
    }

    // Decade filter
    if (selectedDecade !== "Všetky") {
      const decade = Number(selectedDecade);
      pool = pool.filter((g: any) => { const y = safeNum(g.year); return y >= decade && y < decade + 10; });
    }

    // Broad search filter (partial match on Enter)
    if (broadSearchTerm) {
      const term = broadSearchTerm.toLowerCase();
      pool = pool.filter((g: any) =>
        safeStr(g.title).toLowerCase().includes(term) ||
        safeStr(g.genre).toLowerCase().includes(term) ||
        (GENRE_LABELS[g.genre] || g.genre).toLowerCase().includes(term)
      );
    }

    return pool;
  }, [selectedGenre, selectedDecade, broadSearchTerm, games]);

  // Step 2: Sort the filtered set
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "rating":
        arr.sort((a: any, b: any) => {
          const ra = parseInt(safeStr(a.rating), 10) || 0;
          const rb = parseInt(safeStr(b.rating), 10) || 0;
          return rb - ra;
        });
        break;
      case "year":
        arr.sort((a: any, b: any) => safeNum(a.year) - safeNum(b.year));
        break;
      case "name":
        arr.sort((a: any, b: any) => safeStr(a.title).localeCompare(safeStr(b.title)));
        break;
      case "newest":
        arr.sort((a: any, b: any) => safeNum(b.year) - safeNum(a.year));
        break;
      case "shuffle":
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  // Pagination: render in batches to keep the DOM light. Reset on filter/sort change.
  const VISIBLE_STEP = 30;
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
  useEffect(() => setVisibleCount(VISIBLE_STEP), [selectedGenre, selectedDecade, sortBy]);
  const visible = sorted.slice(0, visibleCount);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useReactEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < sorted.length) {
          setVisibleCount((c) => Math.min(c + VISIBLE_STEP, sorted.length));
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [visibleCount, sorted.length]);

  // Fetch next page from Supabase when nearing the end
  useReactEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Featured banner: random highly-rated game from the current filter.
  // Re-pick when filters change, or when filtered goes from empty to non-empty (data loaded).
  const lastFilterKey = useRef("");
  const [featured, setFeatured] = useState<any>(null);
  useEffect(() => {
    const filterKey = `${selectedGenre}-${selectedDecade}-${broadSearchTerm}`;

    if (filtered.length === 0) {
      setFeatured(null);
      lastFilterKey.current = filterKey;
      return;
    }

    // Only re-pick if filter key changed or we had no featured yet
    if (filterKey === lastFilterKey.current && featured) return;
    lastFilterKey.current = filterKey;

    const rated = [...filtered].sort((a: any, b: any) => {
      const ra = parseInt(safeStr(a.rating), 10) || 0;
      const rb = parseInt(safeStr(b.rating), 10) || 0;
      return rb - ra;
    });
    const pool = rated.slice(0, 20);
    setFeatured(pool[Math.floor(Math.random() * pool.length)]);
  }, [selectedGenre, selectedDecade, broadSearchTerm, filtered]);


  // Search dropdown matches: uses games array + debounced input
  const searchMatches = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return [];
    const results: any[] = [];
    for (const g of games) {
      if (
        safeStr(g.title).toLowerCase().includes(s) ||
        safeStr(g.genre).toLowerCase().includes(s) ||
        (GENRE_LABELS[safeStr(g.genre)] || g.genre).toLowerCase().includes(s)
      ) {
        results.push(g);
        if (results.length >= 8) break;
      }
    }
    return results.slice(0, 8);
  }, [debouncedSearch, games]);

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


  // ── Novinky: recent releases (2024+) sorted by year desc ──
  const novinky = useMemo(() => {
    return games
      .filter((g: any) => safeNum(g.year) >= 2024 && g.available)
      .sort((a: any, b: any) => safeNum(b.year) - safeNum(a.year))
      .slice(0, 25);
  }, [games]);

  // ── Trendy: highest-rated games, exclude ones already in novinky ──
  const trendy = useMemo(() => {
    const novinkyIds = new Set(novinky.map((g: any) => g.id));
    return games
      .filter((g: any) => {
        const r = parseInt(safeStr(g.rating), 10) || 0;
        return r >= 75 && g.available && !novinkyIds.has(g.id);
      })
      .sort((a: any, b: any) => {
        const ra = parseInt(safeStr(a.rating), 10) || 0;
        const rb = parseInt(safeStr(b.rating), 10) || 0;
        return rb - ra;
      })
      .slice(0, 25);
  }, [games, novinky]);

  if (isLoading && !games.length) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="flex flex-col gap-10">

      {/* ── Novinky & Trendy rails ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GameRail title="Novinky" games={novinky} onPickGame={pickGame} autoScroll />
        <GameRail title="Trendy" games={trendy} onPickGame={pickGame} />
      </div>

      {/* ── Featured banner ── */}
      {featured && (
        <div
          onClick={() => setLocation(`/hra/${featured.id}`)}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer group"
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.03]"
          />
          {/* Gradient scrim: strongest at bottom-left, fading toward top-right */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/50 to-transparent" />
          {/* Additional bottom fade for extra contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {safeTags(featured.tags).slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-white/70 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {safeStr(featured.title)}
            </h2>
            <p className="text-xs text-white/80 max-w-lg mb-3 hidden sm:block drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{safeStr(featured.description)}</p>
            <div className="flex items-center gap-3 text-[11px] text-white/90 font-mono drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-yellow-300">{safeRating(featured.rating)}</span>
              </div>
              <span>·</span>
              <span>{safeStr(featured.developer)}</span>
              <span>·</span>
              <span>{safeNum(featured.year)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Title + count + filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <h2 className="text-base font-bold text-foreground">Katalóg</h2>
            <span className="text-[11px] text-muted-foreground font-mono">{filtered.length} hier</span>
          </div>
          <div className="h-px flex-1 bg-border/40 hidden sm:block" />

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[120px] h-8 text-xs font-mono bg-card/80 border-border/50 rounded-lg">
                <ArrowDownUp className="w-3 h-3 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Hodnotenie</SelectItem>
                <SelectItem value="newest">Najnovšie</SelectItem>
                <SelectItem value="shuffle">Náhodne</SelectItem>
                <SelectItem value="year">Rok vzostupne</SelectItem>
                <SelectItem value="name">Názov A–Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Decade filter */}
            <Select value={selectedDecade} onValueChange={setSelectedDecade}>
              <SelectTrigger className="w-[100px] h-8 text-xs font-mono bg-card/80 border-border/50 rounded-lg">
                <Filter className="w-3 h-3 mr-1.5 text-muted-foreground" />
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
          </div>
        </div>

        {/* Row 2: Search (full width on mobile) */}
        <div className="relative w-full" ref={searchBoxRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Hľadať…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchOpen(true)}
            data-testid="input-search"
            className="pl-9 pr-8 bg-card border-border/60 h-8 text-xs font-mono rounded-lg w-full sm:w-64"
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
                      <div className="text-xs font-semibold text-foreground truncate">{safeStr(g.title)}</div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {GENRE_LABELS[safeStr(g.genre)] || g.genre} · {safeNum(g.year)}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono ${getRatingColor(g.rating)} shrink-0`}>
                      {safeRating(g.rating)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Genre pills - horizontally scrollable with fade */}
        <div className="relative">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  selectedGenre === g
                    ? "bg-primary text-white"
                    : "bg-card border border-border/50 text-foreground/70 hover:text-foreground hover:border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="absolute top-0 right-0 bottom-2 w-16 bg-background pointer-events-none" />
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              {!game.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground bg-card/90 border border-border/50 px-2.5 py-1 rounded">Nedostupné</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                <Star className={`w-2.5 h-2.5 ${getRatingColor(game.rating)} fill-current`} />
                <span className={`text-[9px] font-mono ${getRatingColor(game.rating)}`}>{safeRating(game.rating)}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{safeStr(game.title)}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{GENRE_LABELS[safeStr(game.genre)] || game.genre} · {safeNum(game.year)}</p>
          </div>
        ))}
      </div>

      {/* ── Infinite Scroll Sentinel ── */}
      <div ref={sentinelRef} className="flex flex-col items-center gap-1.5 pt-4 pb-8 min-h-12 w-full justify-center">
        {(visibleCount < sorted.length || isFetchingNextPage) ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-muted-foreground font-mono">
              Načítavam ďalšie... ({sorted.length - visibleCount} zostáva)
            </span>
          </div>
        ) : (
          sorted.length > 0 && (
            <span className="text-[11px] text-muted-foreground font-mono">
              Zobrazených všetkých {sorted.length} hier
            </span>
          )
        )}
      </div>
    </div>
  );
}
