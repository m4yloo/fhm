import { useRef, useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

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

export const safeTags = (tags: any): string[] => Array.isArray(tags) ? tags : [];
export const safeStr = (v: any): string => (typeof v === "string" ? v : "");
export const safeNum = (v: any): number => (typeof v === "number" ? v : 0);
export const safeRating = (v: any): string => {
  const s = typeof v === "string" ? v : "";
  const num = parseInt(s, 10);
  return isNaN(num) ? "—" : `${num}%`;
};

export const getRatingColor = (rating: string): string => {
  const num = parseInt(rating, 10);
  if (isNaN(num)) return "text-gray-400";
  if (num >= 85) return "text-emerald-400";
  if (num >= 70) return "text-yellow-400";
  if (num >= 50) return "text-orange-400";
  return "text-red-400";
};

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

export function GameRail({
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
