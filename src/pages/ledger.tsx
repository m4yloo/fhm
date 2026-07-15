import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/hooks/useTransactions";
import { useIsMobile } from "@/hooks/use-mobile";
import { LedgerSkeleton } from "@/components/skeletons";
import {
  Info,
  Package,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  game_claim: "Získanie",
  pass_purchase: "Nákup",
  pass_renewal: "Obnovenie",
  pass_upgrade: "Upgrade",
};

export default function Ledger() {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTxInfo, setActiveTxInfo] = useState<any | null>(null);
  const isMobile = useIsMobile();

  const filteredData = useMemo(() => {
    return transactions.filter((row) => {
      const matchesSearch =
        row.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || row.transaction_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [filterType, search, transactions]);

  return (
    <div className="space-y-8">
      {isLoading && !filteredData.length ? <LedgerSkeleton /> : (
        <>
          <div className="border-b border-border/50 pb-8 flex flex-col justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Denník transakcií</h1>
        </div>

        <div className="flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="Hľadať v popise"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-card border-border/60 text-xs font-mono focus-visible:ring-primary rounded-xl"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-card border border-border/60 text-xs px-3 rounded-xl focus:outline-none focus:border-primary text-muted-foreground cursor-pointer font-mono h-9 shrink-0"
          >
            <option value="all">Všetky</option>
            <option value="game_claim">Získanie</option>
            <option value="pass_purchase">Nákup</option>
            <option value="pass_renewal">Obnovenie</option>
            <option value="pass_upgrade">Upgrade</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {!isMobile ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest border-b border-border/50">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Dátum</th>
                  <th className="px-5 py-3.5 font-semibold">Typ</th>
                  <th className="px-5 py-3.5 font-semibold">Popis</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Suma</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredData.map((row) => {
                  const TypeIcon = row.transaction_type === "game_claim" ? Package : TrendingUp;

                  return (
                    <tr
                      key={row.id}
                      data-testid={`row-ledger-${row.id}`}
                      className="hover:bg-background/50 transition-colors group"
                    >
                      <td className="px-5 py-4 font-mono text-muted-foreground whitespace-nowrap text-xs">
                        {new Date(row.created_at).toLocaleDateString("sk-SK")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold font-mono px-2 py-1 rounded-lg border bg-violet-500/10 border-violet-500/20 text-violet-400">
                          <TypeIcon className="w-3 h-3" />
                          {TYPE_LABELS[row.transaction_type] ?? row.transaction_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-foreground font-medium text-sm">
                        {row.description}
                      </td>
                      <td className="px-5 py-4 font-mono text-right font-semibold whitespace-nowrap text-sm text-muted-foreground">
                        {!row.amount ? "-" : row.amount}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveTxInfo(row)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-background border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          title="Zobraziť audit"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredData.map((row) => {
              const TypeIcon = row.transaction_type === "game_claim" ? Package : TrendingUp;

              return (
                <div
                  key={row.id}
                  data-testid={`row-ledger-${row.id}`}
                  className="px-4 py-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <TypeIcon className="w-3 h-3" />
                      {TYPE_LABELS[row.transaction_type] ?? row.transaction_type}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("sk-SK")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{row.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {!row.amount ? "-" : row.amount}
                    </span>
                    <button
                      onClick={() => setActiveTxInfo(row)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(filteredData.length === 0 || isLoading || error) && (
          <div className="py-16 text-center text-muted-foreground font-mono text-xs">
            {isLoading ? "Načítavam transakcie..." : error ? "Nepodarilo sa načítať transakcie." : "Žiadne transakcie."}
          </div>
        )}
      </div>
      </>
      )}

      {activeTxInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-foreground">Detail transakcie</span>
              </div>
              <button
                onClick={() => setActiveTxInfo(null)}
                className="w-7 h-7 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Popis</div>
                <div className="text-foreground font-bold">{activeTxInfo.description}</div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Typ</div>
                <div className="text-foreground font-bold">{TYPE_LABELS[activeTxInfo.transaction_type] ?? activeTxInfo.transaction_type}</div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Dátum</div>
                <div className="text-foreground font-bold">{new Date(activeTxInfo.created_at).toLocaleDateString("sk-SK")}</div>
              </div>
            </div>

            <div className="border-t border-border/50 p-4">
              <Button
                onClick={() => setActiveTxInfo(null)}
                variant="outline"
                className="w-full h-9 text-xs font-mono border-border text-muted-foreground hover:text-foreground"
              >
                Zavrieť
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
