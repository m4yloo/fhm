import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuthContext } from "@/lib/auth-provider";
import {
  Shield,
  Users,
  Gamepad2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface PassRequest {
  id: string;
  user_id: string;
  pass_type: "limited" | "unlimited";
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
  profiles?: { username: string; email?: string } | null;
}

interface Profile {
  id: string;
  username: string;
  created_at: string;
  admin_role: boolean;
}

interface Stats {
  totalUsers: number;
  totalGames: number;
  pendingRequests: number;
  activePasses: number;
  totalUserGames: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground font-mono">
          {value.toLocaleString()}
        </div>
        <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuthContext();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "requests" | "users">("overview");

  // ── Stats ──
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async (): Promise<Stats> => {
      const [users, games, requests, passes, userGames] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("games").select("id", { count: "exact", head: true }),
        supabase
          .from("pass_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("passes")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("user_games").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: users.count ?? 0,
        totalGames: games.count ?? 0,
        pendingRequests: requests.count ?? 0,
        activePasses: passes.count ?? 0,
        totalUserGames: userGames.count ?? 0,
      };
    },
    enabled: isAdmin === true,
  });

  // ── Pass Requests ──
  const { data: passRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["adminPassRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pass_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PassRequest[];
    },
    enabled: isAdmin === true && tab === "requests",
  });

  // ── Users ──
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    enabled: isAdmin === true && tab === "users",
  });

  // ── Approve / Reject mutation ──
  const updateRequest = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => {
      const { error } = await supabase
        .from("pass_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // If approved, create the pass
      if (status === "approved") {
        const request = passRequests.find((r) => r.id === id);
        if (request) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 4);
          const { error: passError } = await supabase.from("user_passes").insert({
            user_id: request.user_id,
            pass_type: request.pass_type,
            games_allowed: request.pass_type === "unlimited" ? 100 : 12,
            games_claimed: 0,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            status: "active",
          });
          if (passError) console.error("Failed to create pass:", passError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPassRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Prístup zamietnutý</h1>
        <p className="text-sm text-muted-foreground">
          Nemáte oprávnenie na prístup k tomuto panelu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-widest mb-2">
            <Shield className="w-3.5 h-3.5" />
            Admin Panel
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        </div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["adminStats"] })
          }
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-3 py-2 hover:bg-card/60 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Obnoviť
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Používatelia"
            value={stats.totalUsers}
            icon={Users}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Hry"
            value={stats.totalGames}
            icon={Gamepad2}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            label="Čakajúce žiadosti"
            value={stats.pendingRequests}
            icon={Clock}
            color="bg-amber-500/10 text-amber-400"
          />
          <StatCard
            label="Aktívne pasy"
            value={stats.activePasses}
            icon={CreditCard}
            color="bg-sky-500/10 text-sky-400"
          />
          <StatCard
            label="Hier v knižniciach"
            value={stats.totalUserGames}
            icon={BarChart3}
            color="bg-violet-500/10 text-violet-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40">
        {(
          [
            ["overview", "Prehľad"],
            ["requests", "Žiadosti o pasy"],
            ["users", "Používatelia"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-mono transition-all border-b-2 -mb-px ${
              tab === key
                ? "text-primary border-primary font-semibold"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Súhrn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Používatelia</span>
                <span className="font-mono font-bold">{stats?.totalUsers ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Hier v katalógu</span>
                <span className="font-mono font-bold">{stats?.totalGames ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Čakajúce žiadosti</span>
                <span className="font-mono font-bold text-amber-400">
                  {stats?.pendingRequests ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Aktívne pasy</span>
                <span className="font-mono font-bold">{stats?.activePasses ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Hier v knižniciach</span>
                <span className="font-mono font-bold">{stats?.totalUserGames ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pass Requests */}
      {tab === "requests" && (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : passRequests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-mono">
              Žiadne žiadosti o pasy.
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-4 py-3">Používateľ</th>
                      <th className="text-left px-4 py-3">Typ pasu</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Dátum</th>
                      <th className="text-right px-4 py-3">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-border/20 last:border-0 hover:bg-card/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {req.user_id.slice(0, 8)}…
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {req.user_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              req.pass_type === "unlimited"
                                ? "bg-primary/10 text-primary"
                                : "bg-sky-500/10 text-sky-400"
                            }`}
                          >
                            {req.pass_type === "unlimited"
                              ? "Neobmedzený"
                              : "Limitovaný"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">
                          {new Date(req.created_at).toLocaleDateString("sk-SK")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === "pending" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  updateRequest.mutate({
                                    id: req.id,
                                    status: "approved",
                                  })
                                }
                                disabled={updateRequest.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Schváliť
                              </button>
                              <button
                                onClick={() =>
                                  updateRequest.mutate({
                                    id: req.id,
                                    status: "rejected",
                                  })
                                }
                                disabled={updateRequest.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                              >
                                <XCircle className="w-3 h-3" />
                                Zamietnuť
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users */}
      {tab === "users" && (
        <div className="space-y-4">
          {usersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-4 py-3">Používateľ</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Registrácia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/20 last:border-0 hover:bg-card/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary font-mono">
                              {u.username[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {u.username}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {u.id.slice(0, 12)}…
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.admin_role ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Shield className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Používateľ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">
                          {new Date(u.created_at).toLocaleDateString("sk-SK")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    cancelled: "bg-muted text-muted-foreground border-border/40",
  };
  const labels: Record<string, string> = {
    pending: "Čakajúca",
    approved: "Schválená",
    rejected: "Zamietnutá",
    cancelled: "Zrušená",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
        styles[status] ?? styles.pending
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
