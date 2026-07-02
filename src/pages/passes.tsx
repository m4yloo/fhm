import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, CreditCard, Infinity, Clock, Sparkles, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id: "limited",
    name: "Limitovaný",
    price: "10",
    period: null,
    description: "Jednorazová platba, 12 hier bez časového limitu.",
    icon: CreditCard,
    accent: "border-border/70 hover:border-primary/40",
    badge: null,
    cta: "Požiadať o limitovaný pas",
    testid: "button-select-metered",
    features: [
      { text: "12 hier celkovo", highlight: true },
      { text: "Bez časového limitu" },
      { text: "Hry možno kedykoľvek uplatniť" },
      { text: "Štandardný katalóg" },
      { text: "Podpora do 24h" },
    ],
  },
  {
    id: "unlimited",
    name: "Neobmedzený",
    price: "15",
    period: "/ 4 mesiace",
    description: "100 hier v priebehu 4 mesiacov, prioritná podpora.",
    icon: Infinity,
    accent: "border-primary/40 shadow-lg shadow-primary/10",
    badge: "Odporúčané",
    cta: "Požiadať o neobmedzený pas",
    testid: "button-select-unlimited",
    features: [
      { text: "100 hier celkovo", highlight: true },
      { text: "Platnosť 4 mesiace" },
      { text: "Prioritná podpora do 1h" },
    ],
  },
];

export default function Passes() {
  const [cakajuci, setCakajuci] = useState<string | null>(null);

  if (cakajuci) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="card-gradient-border p-10 max-w-md w-full flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Žiadosť odoslaná</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tvoja žiadosť o{" "}
              <span className="font-semibold text-foreground">{cakajuci}</span>{" "}
              pas je v poradí. Aktivujeme ho do 24 hodín.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-emerald-500/8 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Operátori online · ~10 min
          </div>
          <Button
            variant="outline"
            onClick={() => setCakajuci(null)}
            data-testid="button-cancel-request"
            className="mt-2 border-border text-muted-foreground hover:text-foreground text-sm w-full"
          >
            Zrušiť žiadosť
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-border/50 pb-8">
        <div className="flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Členstvo
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Členské pasy</h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Zvol si plán a získaj prístup k súkromnej knižnici overených herných licencií.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative bg-card border rounded-2xl p-8 flex flex-col gap-6 transition-all duration-200 ${plan.accent}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md shadow-primary/30">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mt-2">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold font-mono text-foreground">{plan.price} €</span>
                {plan.period && (
                  <span className="text-muted-foreground text-sm font-mono">{plan.period}</span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${feature.highlight ? "bg-primary/15 border border-primary/30" : "bg-card border border-border"}`}>
                      <Check className={`w-2.5 h-2.5 ${feature.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setCakajuci(plan.name)}
                data-testid={plan.testid}
                className={`w-full h-11 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 mt-auto transition-all ${
                  plan.badge
                    ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                    : "bg-card hover:bg-primary/10 border border-border hover:border-primary/50 text-foreground"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Bottom trust signals */}
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground font-mono border-t border-border/40 pt-8">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Aktivácia do 24h
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Bezpečná platba
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Hry zostávajú natrvalo
        </span>
      </div>
    </div>
  );
}
