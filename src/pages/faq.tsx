import { useState } from "react";
import { Construction, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FAQ() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="space-y-10 max-w-3xl relative">

      {/* ── Blurred overlay ── */}
      <div className="absolute inset-0 z-20 backdrop-blur-md bg-background/40 rounded-2xl pointer-events-none" />

      {/* ── Coming Soon popup ── */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPopup(false)} />
          <div className="relative bg-card border border-border/60 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-5 animate-fade-in">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Construction className="w-7 h-7 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-foreground mb-1">Čoskoro</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Podpora a časté otázky sú vo výstavbe. Pracujeme na tom, aby sme vám priniesli kompletný prehľad pravidiel a bezpečnosti.
              </p>
            </div>

            <Button
              onClick={() => setShowPopup(false)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-widest h-10 rounded-xl"
            >
              Rozumiem
            </Button>
          </div>
        </div>
      )}

      {/* ── Header (blurred behind) ── */}
      <div className="border-b border-border/50 pb-8">
        <div className="flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-widest mb-3">
          <Construction className="w-3.5 h-3.5" />
          Vo výstavbe
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Podpora & Časté otázky</h1>
        <p className="text-muted-foreground text-sm">
          Táto sekcia je momentálne vo vývoji. Skúste neskôr.
        </p>
      </div>

      {/* ── Placeholder cards ── */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border/40 rounded-xl p-5 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-2 bg-muted/50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
