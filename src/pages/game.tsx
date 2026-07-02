import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGame } from "@/hooks/useGame";
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
  const { data: game, isLoading, error } = useGame(Number(id));

  // Key claiming state
  const [claimState, setClaimState] = useState<"idle" | "verifying" | "success">("idle");
  const [generatedKey, setGeneratedKey] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

  // Simulate secure license lookup
  const handleClaimKey = () => {
    setClaimState("verifying");

    setTimeout(() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const rWord = (len: number) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const key = `${rWord(5)}-${rWord(5)}-${rWord(5)}`;

      setGeneratedKey(key);
      setClaimState("success");
    }, 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Back button */}
      <button
        onClick={() => setLocation("/kniznica")}
        data-testid="button-back"
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Späť do katalógu
      </button>

      {/* Hero Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12 items-start">
        {/* ── Left Side: Game Cover & Actions ── */}
        <div className="flex flex-col gap-5 w-full sticky top-6">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-[#0c0b11] to-[#1a1a24] border border-border/80 overflow-hidden rounded-2xl shadow-2xl group">
            <img
              src={game.image}
              alt={game.title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!game.available ? "opacity-45 grayscale" : ""}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {!game.available && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground border border-border px-4 py-2 bg-card/80 rounded-lg">
                  Nedostupné
                </span>
              </div>
            )}
          </div>

          {/* Quick Specifications table */}
          <div className="border border-border/60 bg-gradient-to-br from-[#08080c] to-[#0f0f15] rounded-xl p-5 space-y-4 text-xs font-mono shadow-lg">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Platforma</span>
              <span className="text-foreground font-semibold uppercase">{game.platform}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Žáner</span>
              <span className="text-foreground font-semibold text-right">{game.genre}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Rok Vydania</span>
              <span className="text-foreground font-semibold">{game.year}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Developer</span>
              <span className="text-foreground font-semibold truncate max-w-[140px] text-right">{game.developer}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Veľkosť</span>
              <span className="text-foreground font-semibold">{game.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Stav kľúčov</span>
              <span className={game.available ? "text-primary font-semibold" : "text-muted-foreground"}>
                {game.available ? "Na sklade" : "Vypredané"}
              </span>
            </div>
          </div>

          {/* Steam License Claim Button / Status */}
          {game.available ? (
            claimState === "idle" && (
              <Button
                onClick={handleClaimKey}
                data-testid="button-ziskat-detail"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-primary/10 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Získať Hru
              </Button>
            )
          ) : (
            <Button
              disabled
              data-testid="button-ziskat-detail-disabled"
              className="w-full font-mono text-xs uppercase tracking-wide h-12 rounded-xl"
            >
              Momentálne nedostupné
            </Button>
          )}

          {claimState === "verifying" && (
            <div className="bg-[#0f0e15] border border-primary/20 rounded-xl p-4 text-center space-y-3 font-mono text-[11px] animate-pulse text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-primary font-semibold">OVEROVANIE LICENCIE...</p>
                <p className="text-[9px]">Sťahujem kryptografický kľúč z FHP databázy</p>
              </div>
            </div>
          )}

          {claimState === "success" && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-center space-y-4 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-mono text-xs font-bold uppercase">
                <CheckCircle className="w-4 h-4 fill-current" /> Licencia Získaná!
              </div>

              <div className="bg-[#040406] border border-border/80 p-2.5 rounded-lg flex items-center justify-between font-mono text-xs select-all text-foreground">
                <span className="font-semibold tracking-wider">{generatedKey}</span>
                <button
                  onClick={handleCopyKey}
                  className="p-1 hover:text-primary transition-colors text-muted-foreground"
                  title="Kopírovať kľúč"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCopied && (
                <div className="text-[10px] text-emerald-400 font-mono -mt-2 animate-bounce">
                  Kľúč skopírovaný do schránky!
                </div>
              )}

              <div className="text-[9px] text-muted-foreground leading-normal font-mono">
                Aktivujte tento kód vo vašom {game.platform} klientovi. Táto transakcia bola podpísaná a zapísaná v Denníku.
              </div>
            </div>
          )}
        </div>

        {/* ── Right Side: Tabbbed content ── */}
        <div className="space-y-8">
          {/* Title & tagline (always visible above tabs) */}
          <div className="relative">
            <div className="flex items-center gap-3 text-primary text-xs font-mono uppercase tracking-widest mb-4">
              <Layers className="w-4 h-4" />
              <span>{game.genre}</span>
              <span className="text-border">·</span>
              <Calendar className="w-4 h-4" />
              <span>{game.year}</span>
              <span className="text-border">·</span>
              <Star className="w-4 h-4 fill-current" />
              <span className="text-foreground font-semibold">{game.rating}</span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
              {game.title}
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
              {game.description}
            </p>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border/40 p-0 rounded-none gap-6">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground hover:text-foreground text-xs font-mono px-0 py-3 rounded-none border-b-2 border-transparent transition-all"
              >
                Prehľad
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground hover:text-foreground text-xs font-mono px-0 py-3 rounded-none border-b-2 border-transparent transition-all"
              >
                Podrobnosti
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground hover:text-foreground text-xs font-mono px-0 py-3 rounded-none border-b-2 border-transparent transition-all"
              >
                Systém
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Prehľad ── */}
            <TabsContent value="overview" className="mt-8 space-y-8 animate-in fade-in duration-300">
              {/* Long description */}
              <div className="space-y-6">
                {(game.long_description || "").split("\n\n").map((para: string, i: number) => (
                  <p key={i} className="text-[#c4c4c9] leading-relaxed text-base">
                    {para}
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2.5 pt-4">
                {(game.tags || []).map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-lg text-[11px] font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </TabsContent>

            {/* ── Tab: Podrobnosti ── */}
            <TabsContent value="details" className="mt-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Developer" value={game.developer} />
                <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Publisher" value={game.publisher} />
                <InfoRow icon={<Layers className="w-3.5 h-3.5" />} label="Žáner" value={game.genre} />
                <InfoRow icon={<Monitor className="w-3.5 h-3.5" />} label="Platforma" value={game.platform} />
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Rok vydania" value={String(game.year)} />
                <InfoRow icon={<HardDrive className="w-3.5 h-3.5" />} label="Veľkosť" value={game.size} />
                <InfoRow icon={<Star className="w-3.5 h-3.5" />} label="Hodnotenie" value={game.rating} />
                <InfoRow
                  icon={<Tag className="w-3.5 h-3.5" />}
                  label="Stav"
                  value={game.available ? "Dostupné" : "Vypredané"}
                  valueClass={game.available ? "text-primary" : "text-muted-foreground"}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(game.tags || []).map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-card border border-border/80 rounded-md text-[10px] font-mono text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Features (only if they look real) */}
              {(game.features || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Funkcie</h4>
                  <ul className="space-y-1.5 text-sm text-[#c4c4c9]">
                    {game.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Systém ── */}
            <TabsContent value="system" className="mt-6 space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
                  <Cpu className="w-4 h-4" /> Hardvérové Požiadavky
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px] leading-relaxed">
                  {/* Minimum */}
                  <div className="bg-[#08080c] border border-border/50 p-4 rounded-xl space-y-2">
                    <div className="text-muted-foreground uppercase text-[10px] font-bold border-b border-border/30 pb-1 text-primary">
                      Minimálne požiadavky
                    </div>
                    <div>
                      <span className="text-muted-foreground">OS:</span> {(game.sys_requirements_min || {}).os || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">CPU:</span> {(game.sys_requirements_min || {}).cpu || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">RAM:</span> {(game.sys_requirements_min || {}).ram || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">GPU:</span> {(game.sys_requirements_min || {}).gpu || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disk:</span> {(game.sys_requirements_min || {}).storage || '-'}
                    </div>
                  </div>

                  {/* Recommended */}
                  <div className="bg-[#08080c] border border-primary/10 p-4 rounded-xl space-y-2">
                    <div className="text-muted-foreground uppercase text-[10px] font-bold border-b border-border/30 pb-1 text-[#e3e3e6]">
                      Odporúčané požiadavky
                    </div>
                    <div>
                      <span className="text-muted-foreground">OS:</span> {(game.sys_requirements_rec || {}).os || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">CPU:</span> {(game.sys_requirements_rec || {}).cpu || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">RAM:</span> {(game.sys_requirements_rec || {}).ram || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">GPU:</span> {(game.sys_requirements_rec || {}).gpu || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disk:</span> {(game.sys_requirements_rec || {}).storage || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
    <div className="flex items-center gap-2.5 bg-card/50 border border-border/40 rounded-lg px-3 py-2.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground uppercase tracking-wider text-[9px] shrink-0">{label}</span>
      <span className={`ml-auto text-foreground font-semibold text-right truncate ${valueClass || ""}`}>{value}</span>
    </div>
  );
}
