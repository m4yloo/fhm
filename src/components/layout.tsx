import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/lib/auth-provider";
import { Logo } from "@/components/Logo";
import { CommandPalette } from "@/components/CommandPalette";
import {
  Gamepad2,
  User,
  History,
  CreditCard,
  HelpCircle,
  LogOut,
  Sparkles,
  Zap,
  Search,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/kniznica", label: "Katalóg", icon: Gamepad2 },
  { href: "/ucet", label: "Môj účet", icon: User },
  { href: "/dennik", label: "Denník", icon: History },
  { href: "/pasy", label: "Členské pasy", icon: CreditCard },
  { href: "/pomoc", label: "Podpora & FAQ", icon: HelpCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuthContext();

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  const username = user?.email ? user.email.split("@")[0] : "Hosť";
  const initial = (username[0] || "F").toUpperCase();
  const email = user?.email ?? "";

  return (
    // Shell: fixed full-height, no scroll. Only <main> scrolls.
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-background text-foreground font-sans overflow-hidden selection:bg-primary/25 selection:text-primary-foreground">
      <CommandPalette />

      {/* ── Sidebar ── */}
      <aside className="
        w-full md:w-72 shrink-0
        md:h-full md:overflow-hidden
        md:bg-sidebar/60 md:backdrop-blur-xl
        md:border-r border-border/60
        flex flex-col
        relative
      ">
        {/* Ambient glow at top */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/8 rounded-full blur-3xl" />

        <div className="flex flex-col h-full p-5 gap-6 md:overflow-hidden relative z-10">

          {/* ── Logo block: mark + text inline ── */}
          <Link href="/kniznica" className="flex items-center gap-3 py-1 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors" />
              <Logo size={38} className="relative group-hover:scale-105 transition-transform shrink-0" />
            </div>
            <div className="text-left leading-none">
              <div className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                FHP
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/12 px-1.5 py-0.5 rounded">
                  <Zap className="w-2 h-2 fill-current" />Beta
                </span>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground mt-0.5">Herné Poklady</div>
            </div>
          </Link>

          {/* ── Global search trigger ── */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all border border-border/40"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left">Hľadať…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/60 bg-background border border-border/60 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>

          {/* ── Nav ── */}
          <nav className="flex flex-col gap-1">
            <div className="px-3 mb-1.5 text-[9px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Menu
            </div>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`nav-${item.href.replace("/", "")}`}
                  className={`
                    relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                    ${active
                      ? "bg-primary/12 text-primary font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60 hover:translate-x-0.5"
                    }
                  `}
                >
                  {active && (
                    <>
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_12px_2px] shadow-primary/50" />
                      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/10" />
                    </>
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-all ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <span className="flex-1 leading-none">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Bottom block: pushed to the end, non-scrolling ── */}
          <div className="mt-auto flex flex-col gap-3">

            {/* Pass tier card */}
            <Link
              href="/pasy"
              className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/6 to-card p-4 group transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/25 transition-colors" />
              <div className="relative z-10 flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-primary/80 font-semibold">Aktívny pas</span>
                  <span className="text-xs font-bold text-foreground mt-1">Limitovaný pas</span>
                </div>
              </div>
              <div className="relative z-10 mb-2 flex items-end justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">8 / 12 hier</span>
                <span className="text-[10px] font-mono font-bold text-primary">67%</span>
              </div>
              <div className="relative z-10 h-1.5 rounded-full bg-background/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 rounded-full shadow-[0_0_8px_0] shadow-indigo-500/50 transition-all duration-500"
                  style={{ width: "66%" }}
                />
              </div>
            </Link>

            {/* User card */}
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card/40 transition-colors">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary font-mono">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-sidebar shadow-[0_0_6px_0] shadow-emerald-400/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{username}</div>
                <div className="text-[9px] text-muted-foreground font-mono truncate">{email || "neprihlásený"}</div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                title="Odhlásiť sa"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Content (only this scrolls) ── */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden relative">
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto w-full p-6 md:p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
