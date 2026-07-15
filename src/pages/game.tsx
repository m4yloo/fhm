import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { useClaimGame } from "@/hooks/useClaimGame";
import { useUserGames } from "@/hooks/useUserGames";
import { useAuthContext } from "@/lib/auth-provider";
import { GameDetailSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Layers,
  Calendar,
  Star,
  CheckCircle,
  Copy,
  Cpu,
  User,
  Building2,
  Monitor,
  HardDrive,
  Tag,
} from "lucide-react";

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { data: game, isLoading, error } = useGame(Number(id));
  const { data: userGames = [] } = useUserGames();
  const claimGame = useClaimGame();

  const [isCopied, setIsCopied] = useState(false);
  const claimedGame = userGames.find((item) => item.game_id === Number(id));
  const licenseKey = claimedGame?.license_key ?? "";

  if (isLoading) {
    return <GameDetailSkeleton />;
  }

  if (error || !game) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="font-mono text-muted-foreground text-sm">Hra sa nenašla v knižnici.</p>
        <Button
          variant="outline"
          onClick={() => setLocation("/kniznica")}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Späť do katalógu
        </Button>
      </div>
    );
  }

  const handleClaimKey = () => {
    if (!user) {
      setLocation("/prihlasenie");
      return;
    }
    claimGame.mutate(Number(id));
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => setLocation("/kniznica")}
        data-testid="button-back"
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" /> Späť do katalógu
      </button>

      {/* Hero Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 lg:gap-10 items-start">
        {/* ── Left Side: Game Cover & Actions ── */}
        <div className="flex flex-col gap-4 w-full lg:sticky lg:top-6">
          <div className="relative aspect-[3/4] bg-[#0c0b11] border border-border/80 overflow-hidden rounded-xl shadow-2xl group">
            <img
              src={game.image}
              alt={game.title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!game.available ? "opacity-45 grayscale" : ""}`}
            />
            {!game.available && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground border border-border px-3 py-1.5 bg-card/80 rounded-lg">
                  Nedostupné
                </span>
              </div>
            )}
          </div>

          {/* Quick Specifications table */}
          <div className="border border-border/60 bg-[#08080c] rounded-xl p-5 space-y-4 text-[13px] font-mono shadow-lg">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Platforma</span>
              <span className="text-foreground font-semibold uppercase">{game.platform}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Žáner</span>
              <span className="text-foreground font-semibold text-right">{game.genre}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Rok Vydania</span>
              <span className="text-foreground font-semibold">{game.year}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Developer</span>
              <span className="text-foreground font-semibold truncate max-w-[150px] text-right">{game.developer}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Veľkosť</span>
              <span className="text-foreground font-semibold">{game.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Stav</span>
              <span className={game.available ? "text-primary font-semibold" : "text-muted-foreground"}>
                {game.available ? "Na sklade" : "Vypredané"}
              </span>
            </div>
          </div>

          {/* Steam License Claim Button / Status */}
          {claimedGame ? null : game.available ? (
              <Button
                onClick={handleClaimKey}
                data-testid="button-ziskat-detail"
                disabled={claimGame.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-primary/10 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Získať Hru
              </Button>
          ) : (
            <Button
              disabled
              data-testid="button-ziskat-detail-disabled"
              className="w-full font-mono text-xs uppercase tracking-wide h-11 rounded-xl"
            >
              Momentálne nedostupné
            </Button>
          )}

          {claimGame.isPending && (
            <div className="bg-[#0f0e15] border border-primary/20 rounded-xl p-3 text-center space-y-2 font-mono text-[10px] animate-pulse text-muted-foreground">
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-primary font-semibold">PRIPRAVUJEM HRU...</p>
              </div>
            </div>
          )}

          {claimGame.error && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 text-center space-y-1.5 animate-fade-in">
              <div className="text-red-400 font-mono text-[10px] font-bold uppercase">Licenciu sa nepodarilo získať</div>
              <div className="text-[9px] text-muted-foreground leading-normal font-mono">
                Skúste to znova alebo kontaktujte podporu.
              </div>
            </div>
          )}

          {claimedGame && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-center space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-mono text-[10px] font-bold uppercase">
                <CheckCircle className="w-3.5 h-3.5 fill-current" /> Licencia Získaná!
              </div>

              <div className="bg-[#040406] border border-border/80 p-2 rounded-lg flex items-center justify-between font-mono text-[10px] select-all text-foreground">
                <span className="font-semibold tracking-wider">{licenseKey}</span>
                <button
                  onClick={handleCopyKey}
                  className="p-0.5 hover:text-primary transition-colors text-muted-foreground"
                  title="Kopírovať kľúč"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {isCopied && (
                <div className="text-[9px] text-emerald-400 font-mono -mt-1 animate-bounce">
                  Kľúč skopírovaný do schránky!
                </div>
              )}

              <div className="text-[8px] text-muted-foreground leading-normal font-mono">
                Aktivujte tento kód vo vašom {game.platform} klientovi. Táto transakcia bola podpísaná a zapísaná v Denníku.
              </div>
            </div>
          )}
        </div>

        {/* ── Right Side: Tabbbed content ── */}
        <div className="space-y-6">
          {/* Title & tagline (always visible above tabs) */}
          <div className="relative">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-primary text-[11px] font-mono uppercase tracking-widest mb-3">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {game.genre}
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {game.year}
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-foreground font-semibold">{game.rating}</span>
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              {game.title}
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
              {game.description}
            </p>
          </div>

          {/* ── All sections visible ── */}
          <div className="w-full space-y-10">
            {/* ── Prehľad ── */}
            <section className="space-y-5">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-primary">Prehľad</h3>
              <div className="space-y-5">
                {(game.long_description || "").split("\n\n").map((para: string, i: number) => (
                  <p key={i} className="text-[#c4c4c9] leading-relaxed text-sm sm:text-[15px]">
                    {para}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5 pt-3">
                {(game.tags || []).map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-card border border-border/60 rounded-lg text-xs font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <div className="border-t border-border/40" />

            {/* ── Podrobnosti ── */}
            <section className="space-y-6">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-primary">Podrobnosti</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px] font-mono">
                <InfoRow icon={<User className="w-4 h-4" />} label="Developer" value={game.developer} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Publisher" value={game.publisher} />
                <InfoRow icon={<Layers className="w-4 h-4" />} label="Žáner" value={game.genre} />
                <InfoRow icon={<Monitor className="w-4 h-4" />} label="Platforma" value={game.platform} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Rok vydania" value={String(game.year)} />
                <InfoRow icon={<HardDrive className="w-4 h-4" />} label="Veľkosť" value={game.size} />
                <InfoRow icon={<Star className="w-4 h-4" />} label="Hodnotenie" value={game.rating} />
                <InfoRow
                  icon={<Tag className="w-4 h-4" />}
                  label="Stav"
                  value={game.available ? "Dostupné" : "Vypredané"}
                  valueClass={game.available ? "text-primary" : "text-muted-foreground"}
                />
              </div>
            </section>

            <div className="border-t border-border/40" />

            {/* ── Systém ── */}
            <section className="space-y-6">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Systémové požiadavky
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs leading-relaxed">
                <div className="bg-[#08080c] border border-border/50 p-5 rounded-xl space-y-2.5">
                  <div className="text-muted-foreground uppercase text-[11px] font-bold border-b border-border/30 pb-1.5 text-primary">
                    Minimálne požiadavky
                  </div>
                  <div><span className="text-muted-foreground">OS:</span> {(game.sys_requirements_min || {}).os || '-'}</div>
                  <div><span className="text-muted-foreground">CPU:</span> {(game.sys_requirements_min || {}).cpu || '-'}</div>
                  <div><span className="text-muted-foreground">RAM:</span> {(game.sys_requirements_min || {}).ram || '-'}</div>
                  <div><span className="text-muted-foreground">GPU:</span> {(game.sys_requirements_min || {}).gpu || '-'}</div>
                  <div><span className="text-muted-foreground">Disk:</span> {(game.sys_requirements_min || {}).storage || '-'}</div>
                </div>
                <div className="bg-[#08080c] border border-primary/10 p-5 rounded-xl space-y-2.5">
                  <div className="text-muted-foreground uppercase text-[11px] font-bold border-b border-border/30 pb-1.5 text-[#e3e3e6]">
                    Odporúčané požiadavky
                  </div>
                  <div><span className="text-muted-foreground">OS:</span> {(game.sys_requirements_rec || {}).os || '-'}</div>
                  <div><span className="text-muted-foreground">CPU:</span> {(game.sys_requirements_rec || {}).cpu || '-'}</div>
                  <div><span className="text-muted-foreground">RAM:</span> {(game.sys_requirements_rec || {}).ram || '-'}</div>
                  <div><span className="text-muted-foreground">GPU:</span> {(game.sys_requirements_rec || {}).gpu || '-'}</div>
                  <div><span className="text-muted-foreground">Disk:</span> {(game.sys_requirements_rec || {}).storage || '-'}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small info row helper ──
function InfoRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-card/50 border border-border/40 rounded-lg px-3.5 py-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground uppercase tracking-wider text-[10px] shrink-0">{label}</span>
      <span className={`ml-auto text-foreground font-semibold text-right truncate ${valueClass || ""}`}>{value}</span>
    </div>
  );
}
