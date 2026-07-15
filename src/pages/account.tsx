import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/lib/auth-provider";
import { isDevBypassActive } from "@/lib/dev-auth";
import { usePass } from "@/hooks/usePass";
import { useUserGames } from "@/hooks/useUserGames";
import { useRequestPass } from "@/hooks/usePassRequests";
import { AccountSkeleton } from "@/components/skeletons";
import {
  CheckCircle,
  Copy,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  Gamepad2,
  Save,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react";

export default function Account() {
  const [, setLocation] = useLocation();
  const { profile, user, updateProfile } = useAuthContext();
  const isDev = isDevBypassActive();
  const { data: activePass, isLoading: passLoading } = usePass();
  const { data: userGames = [], isLoading: gamesLoading } = useUserGames();
  const [revealKeyId, setRevealKeyId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const renewPass = useRequestPass();

  const passName = activePass?.pass_type === "unlimited" ? "Neobmedzený pas" : "Limitovaný pas";
  const gamesAllowed = activePass?.games_allowed ?? 0;
  const gamesClaimed = activePass?.games_claimed ?? userGames.length;
  const gamesRemaining = activePass ? Math.max(gamesAllowed - gamesClaimed, 0) : 0;
  const daysLeft = activePass
    ? Math.max(Math.ceil((new Date(activePass.expires_at).getTime() - Date.now()) / 86_400_000), 0)
    : 0;

  const handleCopyKey = (id: number, keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const startEditingProfile = () => {
    setEditUsername(profile?.username ?? "");
    setEditEmail(user?.email ?? "");
    setIsEditingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      setProfileError("Používateľské meno nemôže byť prázdne.");
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile({
        username: editUsername.trim(),
        email: editEmail.trim() !== user?.email ? editEmail.trim() : undefined,
      });
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || "Nepodarilo sa uložiť zmeny.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {(passLoading || gamesLoading) && !userGames.length && !activePass ? (
        <AccountSkeleton />
      ) : (
        <>
          {isDev && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-card p-6 md:p-8">
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
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
                Local development bypass is active. Production users come from Supabase Auth.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <Zap className="w-3.5 h-3.5" />
                  Dev session
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Not persisted
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-6 sm:p-8 md:p-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            Aktívny členský pas
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {passLoading ? "Načítavam pas" : activePass ? passName : "Žiadny aktívny pas"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                {activePass
                  ? "Aktívny pas a zostávajúce hry sa zobrazujú automaticky."
                  : "Požiadaj o členstvo v sekcii Členské pasy."}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-3">
                {profile?.username ?? user?.email ?? "member"}
              </p>
            </div>

            <div className="flex flex-wrap gap-8 md:gap-12 border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-12 shrink-0">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">Zostatok hier</div>
                <div className="text-3xl font-extrabold font-mono text-primary" data-testid="text-redemptions-remaining">
                  {isDev ? "inf" : gamesRemaining}{" "}
                  <span className="text-muted-foreground text-xl font-normal">{activePass ? `/ ${gamesAllowed}` : ""}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">Platnost pasu</div>
                <div className="text-3xl font-extrabold font-mono text-foreground" data-testid="text-days-left">
                  {isDev ? "inf" : daysLeft}{" "}
                  <span className="text-muted-foreground text-xl font-normal">{activePass ? "dni" : ""}</span>
                </div>
              </div>
            </div>
          </div>

          {activePass && daysLeft <= 3 && daysLeft > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50 flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Tvoj pas končí o {daysLeft} dní.</p>
              <Button
                onClick={() => renewPass.mutate(activePass.pass_type)}
                disabled={renewPass.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-widest h-9 rounded-xl px-5"
              >
                {renewPass.isPending ? "Predlžujem..." : "Predĺžiť pas"}
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-xl">Profil</h3>
          </div>
          {!isEditingProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditingProfile}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-primary px-3 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Upraviť
            </Button>
          )}
        </div>

        {profileSuccess && (
          <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Zmeny boli uložené.
          </div>
        )}

        {profileError && (
          <div className="mb-4 bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
            {profileError}
          </div>
        )}

        {isEditingProfile ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono block">Používateľské meno</label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="h-10 bg-background border-border/60 text-sm font-mono"
                placeholder="Tvoje meno"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono block">E-mail</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-10 bg-background border-border/60 text-sm font-mono"
                placeholder="email@example.com"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">Na zmenu e-mailu dostaneš potvrdzovací odkaz.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-widest h-9 rounded-xl px-5"
              >
                {profileSaving ? "Ukladám..." : "Uložiť"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsEditingProfile(false)}
                className="h-9 text-xs font-mono text-muted-foreground hover:text-foreground px-4"
              >
                Zrušiť
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Používateľské meno</span>
              <span className="text-sm font-medium text-foreground">{profile?.username ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">E-mail</span>
              <span className="text-sm font-medium text-foreground">{user?.email ?? "—"}</span>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-xl">Hry v trezore</h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-card border border-border/60 px-3 py-1 rounded-lg" data-testid="text-game-count">
            {gamesLoading ? "..." : userGames.length} hier
          </span>
        </div>

        {userGames.length === 0 && !gamesLoading ? (
          <div className="bg-card border border-dashed border-border/60 rounded-2xl p-8 text-sm text-muted-foreground">
            Zatiaľ nemáš žiadne uplatnené hry. Keď získaš licenciu, objaví sa tu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userGames.map((item) => {
              const isRevealed = revealKeyId === item.game_id;
              const isCopied = copiedKeyId === item.game_id;

              return (
                <div
                  key={item.id}
                  data-testid={`card-redeemed-${item.id}`}
                  className="group bg-card border border-border/60 hover:border-primary/35 rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 cursor-pointer"
                  onClick={() => setLocation(`/hra/${item.game_id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {item.game.title}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground bg-background border border-border/50 px-2 py-0.5 rounded-md shrink-0">
                      {new Date(item.acquired_at).toLocaleDateString("sk-SK")}
                    </span>
                  </div>

                  <div
                    className="bg-background border border-border/60 rounded-lg px-3 py-2.5 flex items-center justify-between font-mono text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={`tracking-widest transition-all ${isRevealed ? "text-foreground" : "text-muted-foreground/40 select-none"}`}>
                      {isRevealed ? item.license_key : ".....-.....-....."}
                    </span>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        onClick={() => setRevealKeyId(isRevealed ? null : item.game_id)}
                        className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                        title={isRevealed ? "Skryť kľúč" : "Zobraziť kľúč"}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyKey(item.game_id, item.license_key)}
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
                      {item.game.platform}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] font-mono text-muted-foreground hover:text-primary px-2 flex items-center gap-1"
                      onClick={(e) => { e.stopPropagation(); setLocation(`/hra/${item.game_id}`); }}
                    >
                      Detaily <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
