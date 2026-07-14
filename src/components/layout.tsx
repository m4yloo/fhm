import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/lib/auth-provider";
import { Logo } from "@/components/Logo";
import { CommandPalette } from "@/components/CommandPalette";
import { usePass } from "@/hooks/usePass";
import { useUserGames } from "@/hooks/useUserGames";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Gamepad2,
  User,
  History,
  CreditCard,
  HelpCircle,
  LogOut,
  Sparkles,
  Search,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const NAV_ITEMS = [
  { href: "/kniznica", label: "Katalóg", icon: Gamepad2 },
  { href: "/ucet", label: "Účet", icon: User },
  { href: "/dennik", label: "Denník", icon: History },
  { href: "/pasy", label: "Pasy", icon: CreditCard },
  { href: "/pomoc", label: "FAQ", icon: HelpCircle },
];

// Extra nav items shown only in the mobile drawer (not in bottom bar)
const DRAWER_EXTRA_ITEMS = [
  { href: "/pasy", label: "Členské pasy", icon: CreditCard },
  { href: "/pomoc", label: "Podpora & FAQ", icon: HelpCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuthContext();
  const { data: activePass } = usePass();
  const { data: userGames = [] } = useUserGames();
  const { data: isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  const username = user?.email ? user.email.split("@")[0] : "Hosť";
  const initial = (username[0] || "F").toUpperCase();
  const email = user?.email ?? "";

  const hasPass = !!activePass;
  const passName = activePass?.name ?? "Pas";
  const gamesAllowed = activePass?.redemptions_total ?? 0;
  const gamesClaimed = activePass?.redemptions_used ?? userGames.length;
  const percentage = gamesAllowed > 0
    ? Math.min(Math.round((gamesClaimed / gamesAllowed) * 100), 100)
    : 0;

  const currentPageTitle = NAV_ITEMS.find((item) => isActive(item.href))?.label ?? "FHP";

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <>
      <div className="h-[100dvh] w-full flex flex-col bg-background text-foreground font-sans overflow-hidden selection:bg-primary/25 selection:text-primary-foreground">
        <CommandPalette />

        {/* ── Mobile top bar ── */}
        <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-xl z-40">
          <div className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-extrabold text-sm tracking-tight">FHP</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* ── Mobile drawer (slide-in from right) ── */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-sidebar/95 backdrop-blur-xl border-l border-border/60 z-50 flex flex-col animate-slide-in-right">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <Logo size={24} />
                  <span className="font-extrabold text-sm">FHP</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                {/* Full nav */}
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`
                          relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all
                          ${active
                            ? "bg-primary/12 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                          }
                        `}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                        )}
                        <Icon className={`w-4.5 h-4.5 ${active ? "text-primary" : "text-muted-foreground/70"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className={`
                        relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all
                        ${isActive("/admin")
                          ? "bg-primary/12 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                        }
                      `}
                    >
                      {isActive("/admin") && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                      )}
                      <Shield className={`w-4.5 h-4.5 ${isActive("/admin") ? "text-primary" : "text-muted-foreground/70"}`} />
                      <span>Admin</span>
                    </Link>
                  )}
                </nav>

                <div className="h-px bg-border/40" />

                {/* Bottom section — auth-dependent */}
                {user ? (
                  <>
                    {/* Pass card */}
                    <Link
                      href="/pasy"
                      onClick={() => setDrawerOpen(false)}
                      className="relative overflow-hidden rounded-xl border border-primary/25 bg-card p-4 group transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-primary/80 font-semibold">
                            {hasPass ? "Aktívny pas" : "Členstvo"}
                          </span>
                          <span className="text-xs font-bold text-foreground mt-1">
                            {hasPass ? passName : "Žiadny aktívny pas"}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {hasPass ? `${gamesClaimed} / ${gamesAllowed} hier` : "Požiadať o pas"}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-primary">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-background/60 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </Link>

                    <div className="h-px bg-border/40" />

                    {/* User card */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary font-mono">
                          {initial}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-sidebar" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{username}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{email}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href="/prihlasenie"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center h-10 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all"
                  >
                    Prihlásiť sa
                  </Link>
                )}
              </div>

              {/* Drawer footer — only for authenticated users */}
              {user && (
                <div className="p-5 border-t border-border/50">
                  <button
                    onClick={() => { signOut(); setDrawerOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Odhlásiť sa
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full p-4 pb-24">
            {children}
          </div>
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="shrink-0 h-16 flex items-stretch border-t border-border/50 bg-background/90 backdrop-blur-xl z-40 safe-area-bottom">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.href.replace("/", "")}`}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground/70"}`} strokeWidth={active ? 2.2 : 1.8} />
                <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      </>
    );
  }

  // ── Desktop layout ──
  return (
    <>
    <div className="h-[100dvh] w-full flex flex-row bg-background text-foreground font-sans overflow-hidden selection:bg-primary/25 selection:text-primary-foreground">
      <CommandPalette />

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 h-full overflow-hidden bg-sidebar/60 backdrop-blur-xl border-r border-border/60 flex flex-col relative">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/8 rounded-full blur-3xl" />

        <div className="flex flex-col h-full p-5 gap-5 overflow-hidden relative z-10">
          <Link href="/kniznica" className="flex items-center gap-3 py-1 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors" />
              <Logo size={44} className="relative group-hover:scale-105 transition-transform shrink-0" />
            </div>
            <div className="text-left leading-none">
              <div className="font-extrabold text-base tracking-tight text-foreground">FHP</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Herné Poklady</div>
            </div>
          </Link>

          <nav className="flex flex-col gap-0.5">
            <div className="px-3 mb-1 text-[9px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
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
            {isAdmin && (
              <Link
                href="/admin"
                className={`
                  relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                  ${isActive("/admin")
                    ? "bg-primary/12 text-primary font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60 hover:translate-x-0.5"
                  }
                `}
              >
                {isActive("/admin") && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_12px_2px] shadow-primary/50" />
                    <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/10" />
                  </>
                )}
                <Shield
                  className={`w-4 h-4 shrink-0 transition-all ${isActive("/admin") ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`}
                  strokeWidth={isActive("/admin") ? 2.4 : 2}
                />
                <span className="flex-1 leading-none">Admin</span>
              </Link>
            )}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href="/pasy"
                  className="relative overflow-hidden rounded-xl border border-primary/25 bg-card p-4 group transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-primary/80 font-semibold">
                        {hasPass ? "Aktívny pas" : "Členstvo"}
                      </span>
                      <span className="text-xs font-bold text-foreground mt-0.5">
                        {hasPass ? passName : "Žiadny aktívny pas"}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {hasPass ? `${gamesClaimed} / ${gamesAllowed} hier` : "Požiadať o pas"}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-background/60 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </Link>

                <div className="h-px bg-border/40" />

                <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card/40 transition-colors">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary font-mono">
                    {initial}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-sidebar shadow-[0_0_6px_0] shadow-emerald-400/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{username}</div>
                  <div className="text-[9px] text-muted-foreground font-mono truncate">{email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                  title="Odhlásiť sa"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              </>
            ) : (
              <Link
                href="/prihlasenie"
                className="flex items-center justify-center h-10 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20"
              >
                Prihlásiť sa
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden relative">
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto w-full p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
    </>
  );
}
