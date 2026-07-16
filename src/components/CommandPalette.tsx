import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useGames } from "@/hooks/useGames";
import { Search, Gamepad2, ArrowRight } from "lucide-react";
import { GENRE_LABELS } from "@/components/library/GameRail";

// Pre-build a flat search index: title + genre lowercase for fast matching.
interface QuickEntry {
  id: number;
  title: string;
  genre: string;
  image: string;
  year: number;
  rating: string;
}

const NAV_PAGES = [
  { label: "Katalóg", href: "/kniznica", keywords: "library catalog kniznica hry" },
  { label: "Môj účet", href: "/ucet", keywords: "account ucet profil settings" },
  { label: "Denník", href: "/dennik", keywords: "ledger journal dennik historial log" },
  { label: "Členské pasy", href: "/pasy", keywords: "passes membership pasy tier" },
  { label: "Podpora & FAQ", href: "/pomoc", keywords: "support help faq pomoc" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data } = useGames();
  const games = data?.pages?.flat() ?? [];

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setLocation(href);
    },
    [setLocation],
  );

  const gameResults = useMemo(() => {
    const flat: QuickEntry[] = games.map((g: any) => ({
      id: g.id,
      title: g.title,
      genre: g.genre,
      image: g.image,
      year: g.year,
      rating: g.rating,
    }));
    return flat.slice(0, 200); // cap to keep cmdk snappy
  }, [games]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Hľadať hry, stránky…" />
      <CommandList>
        <CommandEmpty>
          <div className="text-center py-6">
            <Search className="w-5 h-5 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Žiadne výsledky.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Skúste iný vyhľadávací výraz.</p>
          </div>
        </CommandEmpty>

        {/* Nav pages */}
        <CommandGroup heading="Navigácia">
          {NAV_PAGES.map((page) => (
            <CommandItem
              key={page.href}
              value={`${page.label} ${page.keywords}`}
              onSelect={() => navigate(page.href)}
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Games */}
        <CommandGroup heading="Hry">
          {gameResults.map((g) => (
            <CommandItem
              key={g.id}
              value={`${g.title} ${(GENRE_LABELS[g.genre] || g.genre).toLowerCase()} ${g.year}`}
              onSelect={() => navigate(`/hra/${g.id}`)}
              className="flex items-center gap-3"
            >
              <img
                src={g.image}
                alt=""
                className="w-7 h-7 rounded object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{g.title}</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {GENRE_LABELS[g.genre] || g.genre} · {g.year}
                </div>
              </div>
              <Gamepad2 className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
