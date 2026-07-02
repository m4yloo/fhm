import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth-provider";
import { isDevBypassActive } from "@/lib/dev-auth";
import {
  Key,
  ShieldCheck,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  Database,
  Link2,
  User,
  Crown,
  Zap,
} from "lucide-react";

const ZISKANE_HRY = [
  { id: 1, title: "Hades II", date: "2024-01-05", platform: "Steam", key: "HDN2A-ZGRS9-PLTO8" },
  { id: 5, title: "Outer Wilds", date: "2023-11-02", platform: "Steam", key: "OWLD8-TMELP-NOMAI" },
  { id: 2, title: "Elden Ring", date: "2023-12-10", platform: "Steam", key: "ELDRG-SOU1S-RING7" },
  { id: 8, title: "Portal 2", date: "2023-10-15", platform: "Steam", key: "PTL2V-GLDOS-WHTLY" },
];

const LINKED_ACCOUNTS = [
  {
    label: "Discord",
    name: "bean_enjoyer",
    id: "482910394019",
    status: "connected",
    color: "text-[#5865F2]",
    bg: "bg-[#5865F2]/10 border-[#5865F2]/25",
    initial: "D",
  },
  {
    label: "Steam",
    name: "bean_games",
    id: "7656119800000",
    status: "connected",
    color: "text-sky-400",
    bg: "bg-sky-400/10 border-sky-400/25",
    initial: "S",
  },
  {
    label: "Epic Games",
    name: null,
    id: null,
    status: "disconnected",
    color: "text-muted-foreground",
    bg: "bg-card border-border/50",
    initial: "E",
  },
];

export default function Account() {
  const [, setLocation] = useLocation();
  const { profile } = useAuthContext();
  const isDev = isDevBypassActive();
  const [revealKeyId, setRevealKeyId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<"idle" | "success" | "error">("idle");

  const handleCopyKey = (id: number, keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleVerify = () => {
    if (!verificationCode.trim()) return;
    if (verificationCode.includes("-") && verificationCode.length >= 10) {
      setVerificationResult("success");
    } else {
      setVerificationResult("error");
    }
  };

  return (
    <div className="space-y-10">

      {/* ── Dev Account Banner ── */}
      {isDev && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card p-6 md:p-8">
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-extrabold text-amber-400">Developer Mode</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] font-mono text-amber-300 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enhanced account with unlimited access and administrative privileges.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <Zap className="w-3.5 h-3.5" />
                  Unlimited Access
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Role
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <Database className="w-3.5 h-3.5" />
                  Full DB Access
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Active pass hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card p-8 md:p-10">
        {/* Background decoration */}
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[60px] -translate-x-1/4 translate-y-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            Aktívny členský pas
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {isDev ? "Developer Unlimited" : "Limitovaný pas"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                {isDev 
                  ? "Neobmedzený prístup ku všetkým hrám v knižnici bez obmedzení."
                  : "Získaj až 12 plných verzií hier. Hry v knižnici ti zostanú navždy."
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-8 md:gap-12 border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-12 shrink-0">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">Zostatok hier</div>
                <div className="text-3xl font-extrabold font-mono text-primary" data-testid="text-redemptions-remaining">
                  {isDev ? "∞" : "8"}{" "}
                  <span className="text-muted-foreground text-xl font-normal">{isDev ? "" : " / 12"}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">Platnosť pasu</div>
                <div className="text-3xl font-extrabold font-mono text-foreground" data-testid="text-days-left">
                  {isDev ? "∞" : "14"}{" "}
                  <span className="text-muted-foreground text-xl font-normal">{isDev ? "" : " dní"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Linked accounts ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Prepojené účty</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LINKED_ACCOUNTS.map((acc) => (
            <div
              key={acc.label}
              className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${acc.bg} ${acc.color}`}>
                {acc.initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{acc.label}</span>
                  <span className={`text-[9px] font-bold font-mono uppercase ${acc.status === "connected" ? "text-emerald-400" : "text-amber-400"}`}>
                    {acc.status === "connected" ? "Prepojené" : "Neprepojené"}
                  </span>
                </div>
                {acc.name ? (
                  <>
                    <div className="text-xs font-semibold text-foreground truncate">{acc.name}</div>
                    <div className="text-[9px] text-muted-foreground font-mono truncate">ID: {acc.id}</div>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono text-primary hover:text-primary px-0 mt-0.5">
                    + Prepojiť účet
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Key vault ── */}
      <section>
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-xl">Kľúče v trezore</h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-card border border-border/60 px-3 py-1 rounded-lg" data-testid="text-game-count">
            {ZISKANE_HRY.length} hier
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ZISKANE_HRY.map((hra) => {
            const isRevealed = revealKeyId === hra.id;
            const isCopied = copiedKeyId === hra.id;

            return (
              <div
                key={hra.id}
                data-testid={`card-redeemed-${hra.id}`}
                className="group bg-card border border-border/60 hover:border-primary/35 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 cursor-pointer"
                onClick={() => setLocation(`/hra/${hra.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {hra.title}
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground bg-background border border-border/50 px-2 py-0.5 rounded-md shrink-0">
                    {hra.date}
                  </span>
                </div>

                {/* Key display */}
                <div
                  className="bg-background border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between font-mono text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`tracking-widest transition-all ${isRevealed ? "text-foreground" : "text-muted-foreground/40 select-none"}`}>
                    {isRevealed ? hra.key : "•••••-•••••-•••••"}
                  </span>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => setRevealKeyId(isRevealed ? null : hra.id)}
                      className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                      title={isRevealed ? "Skryť kľúč" : "Zobraziť kľúč"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(hra.id, hra.key)}
                      className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                      title="Kopírovať kľúč"
                    >
                      {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {hra.platform}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] font-mono text-muted-foreground hover:text-primary px-2 flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); setLocation(`/hra/${hra.id}`); }}
                  >
                    Detaily <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Key verifier ── */}
      <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-base">Overovač integrity kľúčov</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-xl">
          Vložte kľúč alebo podpis transakcie pre overenie jeho platnosti v databáze FHP.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            placeholder="Napr: PTL2V-GLDOS-WHTLY alebo hash transakcie…"
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value);
              setVerificationResult("idle");
            }}
            className="flex-1 bg-background border border-border/70 focus:border-primary px-4 py-2.5 rounded-xl font-mono text-xs focus:outline-none text-foreground placeholder:text-muted-foreground/50 transition-colors"
          />
          <Button
            onClick={handleVerify}
            className="bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-wider px-5 rounded-xl shrink-0 shadow-lg shadow-primary/20"
          >
            Overiť
          </Button>
        </div>

        {verificationResult === "success" && (
          <div className="mt-4 bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 max-w-xl flex gap-3 items-start animate-fade-in">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="font-mono text-xs space-y-1">
              <div className="text-emerald-400 font-bold">Kľúč je validný · SHA-256 OK</div>
              <div className="text-muted-foreground text-[10px] leading-relaxed">
                Kľúč sa nachádza v databáze, patrí užívateľovi bean_enjoyer a je priradený k transakcii z FHP licenčného servera.
              </div>
            </div>
          </div>
        )}

        {verificationResult === "error" && (
          <div className="mt-4 bg-red-500/5 border border-red-500/25 rounded-xl p-4 max-w-xl flex gap-3 items-start animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">!</div>
            <div className="font-mono text-xs space-y-1">
              <div className="text-red-400 font-bold">Kľúč nenájdený</div>
              <div className="text-muted-foreground text-[10px] leading-relaxed">
                Zadaný kód nezodpovedá žiadnej aktívnej transakcii v databáze FHP. Skontrolujte formát.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
