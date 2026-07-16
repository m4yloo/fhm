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
  ArrowDownUp,
  Filter,
  ArrowUp,
} from "lucide-react";
import { useEffect as useReactEffect } from "react";
import { GameRail, GENRE_LABELS, safeStr, safeNum, safeRating, getRatingColor, safeTags } from "@/components/library/GameRail";

// ── Shared carousel card component ──
// Now in @/components/library/GameRail

const DECADE_LABELS: Record<number, string> = {
  1980: "80s",
  1990: "90s",
  2000: "2000s",
  2010: "2010s",
  2020: "2020s",
};

// ── Scrollable horizontal rail with auto-scroll ──
// Now in @/components/library/GameRail

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
  const genreContainerRef = useRef<HTMLDivElement>(null);
  const genreScrollRef = useRef<HTMLDivElement>(null);
  const [genreCanScrollRight, setGenreCanScrollRight] = useState(false);

  const updateGenreFade = useCallback(() => {
    const el = genreContainerRef.current;
    if (!el) return;
    setGenreCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    updateGenreFade();
    window.addEventListener("resize", updateGenreFade);
    return () => window.removeEventListener("resize", updateGenreFade);
  }, [updateGenreFade]);

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

  // Re-check genre fade when genres change
  useEffect(() => { updateGenreFade(); }, [genres, updateGenreFade]);

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => setVisibleCount(VISIBLE_STEP), [selectedGenre, selectedDecade, sortBy]);
  
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
        <div className="hidden lg:block">
          <GameRail title="Novinky" games={novinky} onPickGame={pickGame} autoScroll />
        </div>
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

      {/* ── Enhanced Control Panel ── */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Row 1: Search + Count */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full" ref={searchBoxRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Hľadať v katalógu…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setSearchOpen(true)}
              data-testid="input-search"
              className="pl-9 pr-8 bg-background border-border/60 h-10 text-sm font-mono rounded-xl w-full"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setBroadSearchTerm("");
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown results */}
            {searchOpen && search.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {searchMatches.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <Search className="w-4 h-4 text-muted-foreground/40 mx-auto mb-1.5" />
                    <p className="text-[11px] font-mono text-muted-foreground">Žiadne výsledky.</p>
                  </div>
                ) : (
                  searchMatches.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => pickGame(g.id)}
                      data-testid={`search-result-${g.id}`}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                    >
                      <img src={g.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">{safeStr(g.title)}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">{GENRE_LABELS[safeStr(g.genre)] || g.genre} · {safeNum(g.year)}</div>
                      </div>
                      <span className={`text-[10px] font-mono ${getRatingColor(g.rating)} shrink-0`}>{safeRating(g.rating)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="text-xs font-mono text-muted-foreground whitespace-nowrap px-2">
            {filtered.length} hier
          </div>
        </div>

        {/* Row 2: Sort + Decade + Genres */}
        <div className="flex flex-col sm:flex-row gap-3 items-center pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="flex-1 sm:w-[130px] h-9 text-xs font-mono bg-background border-border/50 rounded-lg">
                  <ArrowDownUp className="w-3 h-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Najlepšie</SelectItem>
                  <SelectItem value="newest">Najnovšie</SelectItem>
                  <SelectItem value="shuffle">Náhodne</SelectItem>
                  <SelectItem value="year">Rok vzostupne</SelectItem>
                  <SelectItem value="name">Názov A–Z</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDecade} onValueChange={setSelectedDecade}>
                <SelectTrigger className="flex-1 sm:w-[110px] h-9 text-xs font-mono bg-background border-border/50 rounded-lg">
                  <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Obdobie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Všetky">Všetky</SelectItem>
                  {ALL_DECADES.map((d) => (
                    <SelectItem key={d} value={String(d)}>{DECADE_LABELS[d] || `${d}s`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="h-px sm:h-6 w-full sm:w-px bg-border/50" />

          {/* Genre pills */}
          <div className="relative w-full flex-1 min-w-0" ref={genreScrollRef}>
            <div
              ref={genreContainerRef}
              onScroll={updateGenreFade}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedGenre === g
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background border border-border/50 text-foreground/70 hover:bg-card hover:border-border"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty ── */}
      {sorted.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border/60 flex items-center justify-center mb-5">
            <Search className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Žiadne hry</h3>
          <p className="text-sm text-muted-foreground font-mono max-w-xs">
            Skúste upraviť filtre alebo zmeniť vyhľadávací výraz, aby si našiel nové poklady.
          </p>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
        {visible.map((game) => (
            <div
              key={game.id}
              data-testid={`card-game-${game.id}`}
              className="group cursor-pointer transition-all duration-300 hover:-translate-y-2"
              onClick={() => setLocation(`/hra/${game.id}`)}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/40 group-hover:border-primary/50 transition-all duration-300 mb-3 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/10">
                <img
                  src={game.image}
                  alt={game.title}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    game.available ? "" : "grayscale opacity-30"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                {!game.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground bg-card/90 border border-border/50 px-2.5 py-1 rounded">Nedostupné</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                  <Star className={`w-2.5 h-2.5 ${getRatingColor(game.rating)} fill-current`} />
                  <span className={`text-[9px] font-mono ${getRatingColor(game.rating)}`}>{safeRating(game.rating)}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors px-1">{safeStr(game.title)}</p>
              <p className="text-[11px] text-muted-foreground font-mono truncate px-1">{GENRE_LABELS[safeStr(game.genre)] || game.genre} · {safeNum(game.year)}</p>
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

        {/* ── Back to Top Button ── */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all duration-200"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
