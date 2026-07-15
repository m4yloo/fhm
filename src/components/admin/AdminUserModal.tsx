import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  X,
  User,
  CreditCard,
  Gamepad2,
  Clock,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  Calendar,
  Shield,
  ExternalLink,
} from "lucide-react";
import type { AdminUserPass, AdminUserGame, AdminTransaction } from "./types";

interface Props {
  userId: string;
  onClose: () => void;
}

export function AdminUserModal({ userId, onClose }: Props) {
  const [tab, setTab] = useState<"pass" | "games" | "transactions">("pass");
  const [revealKeyId, setRevealKeyId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["adminUserProfile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: userPass } = useQuery({
    queryKey: ["adminUserPass", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_passes")
        .select("id, user_id, pass_type, status, games_allowed, games_claimed, expires_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AdminUserPass | null;
    },
  });

  const { data: userGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["adminUserGames", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_games")
        .select("id, game_id, license_key, acquired_at, game:games(title, platform, image)")
        .eq("user_id", userId)
        .order("acquired_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminUserGame[];
    },
    enabled: tab === "games",
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["adminUserTransactions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminTransaction[];
    },
    enabled: tab === "transactions",
  });

  const handleCopyKey = (id: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const passName = userPass?.pass_type === "unlimited" ? "Neobmedzený" : "Limitovaný";
  const daysLeft = userPass
    ? Math.max(Math.ceil((new Date(userPass.expires_at).getTime() - Date.now()) / 86_400_000), 0)
    : 0;

  const typeLabels: Record<string, string> = {
    game_claim: "Získanie hry",
    pass_purchase: "Nákup pasu",
    pass_renewal: "Obnovenie pasu",
    pass_upgrade: "Upgrade pasu",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border/60 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary font-mono shrink-0">
              {profileLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                (profile?.username?.[0]?.toUpperCase() ?? "?")
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">
                {profileLoading ? "Načítavam..." : profile?.username ?? "—"}
              </h2>
              <div className="text-[11px] text-muted-foreground font-mono truncate">
                {userId.slice(0, 16)}…
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info bar */}
        <div className="px-6 py-3 border-b border-border/30 bg-background/50 flex flex-wrap gap-4 text-[11px] font-mono text-muted-foreground shrink-0">
          <span className="flex items-center gap-1.5">
            <User className="w-3 h-3" />
            {profile?.username ?? "—"}
          </span>
          {profile?.admin_role && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("sk-SK") : "—"}
          </span>
          {userPass && (
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3 h-3" />
              {passName} pas · {daysLeft} dní
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border/40 shrink-0">
          {([
            ["pass", "Pas", CreditCard],
            ["games", "Hry", Gamepad2],
            ["transactions", "Transakcie", Clock],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-all border-b-2 -mb-px ${
                tab === key
                  ? "text-primary border-primary font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Pass tab */}
          {tab === "pass" && (
            <div className="space-y-4">
              {!userPass ? (
                <div className="text-center py-12 text-muted-foreground text-sm font-mono">
                  Používateľ nemá žiadny pas.
                </div>
              ) : (
                <>
                  <div className="bg-background border border-border/50 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Typ pasu</span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        userPass.pass_type === "unlimited"
                          ? "bg-primary/10 text-primary"
                          : "bg-sky-500/10 text-sky-400"
                      }`}>
                        {passName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Status</span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        userPass.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {userPass.status === "active" ? "Aktívny" : userPass.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Hier</span>
                      <span className="text-sm font-mono font-bold text-foreground">
                        {userPass.games_claimed} / {userPass.games_allowed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Expirácia</span>
                      <span className="text-sm font-mono font-bold text-foreground">
                        {new Date(userPass.expires_at).toLocaleDateString("sk-SK")} ({daysLeft} dní)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Vytvorený</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {new Date(userPass.created_at).toLocaleDateString("sk-SK")}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background border border-border/50 rounded-xl p-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground font-mono">Využitie</span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {userPass.games_allowed > 0
                          ? Math.round((userPass.games_claimed / userPass.games_allowed) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${userPass.games_allowed > 0
                            ? Math.min((userPass.games_claimed / userPass.games_allowed) * 100, 100)
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Games tab */}
          {tab === "games" && (
            <div className="space-y-3">
              {gamesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userGames.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm font-mono">
                  Používateľ nemá žiadne hry.
                </div>
              ) : (
                <>
                  <div className="text-[11px] text-muted-foreground font-mono mb-2">
                    {userGames.length} hier
                  </div>
                  {userGames.map((item) => {
                    const isRevealed = revealKeyId === item.game_id;
                    const isCopied = copiedKeyId === item.game_id;
                    const gameData = Array.isArray(item.game) ? item.game[0] : item.game;
                    return (
                      <div
                        key={item.id}
                        className="bg-background border border-border/50 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {gameData?.title ?? `Hra #${item.game_id}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {gameData?.platform} · {new Date(item.acquired_at).toLocaleDateString("sk-SK")}
                            </div>
                          </div>
                        </div>
                        <div className="bg-card border border-border/60 rounded-lg px-3 py-2 flex items-center justify-between font-mono text-xs">
                          <span className={`tracking-widest transition-all ${isRevealed ? "text-foreground" : "text-muted-foreground/40 select-none"}`}>
                            {isRevealed ? item.license_key : ".....-.....-....."}
                          </span>
                          <div className="flex items-center gap-1 ml-3 shrink-0">
                            <button
                              onClick={() => setRevealKeyId(isRevealed ? null : item.game_id)}
                              className="p-1 rounded hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopyKey(item.game_id, item.license_key)}
                              className="p-1 rounded hover:bg-card text-muted-foreground hover:text-primary transition-colors"
                            >
                              {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Transactions tab */}
          {tab === "transactions" && (
            <div className="space-y-3">
              {txLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm font-mono">
                  Žiadne transakcie.
                </div>
              ) : (
                <>
                  <div className="text-[11px] text-muted-foreground font-mono mb-2">
                    {transactions.length} transakcií
                  </div>
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-background border border-border/50 rounded-xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {typeLabels[tx.transaction_type] ?? tx.transaction_type} · {new Date(tx.created_at).toLocaleDateString("sk-SK")}
                        </div>
                      </div>
                      {tx.amount != null && (
                        <span className="text-xs font-mono font-bold text-foreground shrink-0">
                          {tx.amount > 0 ? "+" : ""}{tx.amount}€
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-6 py-3 shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-9 text-xs font-mono border-border text-muted-foreground hover:text-foreground"
          >
            Zavrieť
          </Button>
        </div>
      </div>
    </div>
  );
}
