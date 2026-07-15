import { Button } from "@/components/ui/button";
import { useCancelPassRequest, usePassRequests, useRequestPass } from "@/hooks/usePassRequests";
import { PassesSkeleton } from "@/components/skeletons";
import { ArrowRight, Check, Clock, CreditCard, Infinity, Sparkles } from "lucide-react";

const PLANS = [
  {
    id: "limited" as const,
    name: "Limitovaný",
    price: "9.99",
    period: null,
    description: "Jednorazová žiadosť o pas pre 12 hier.",
    icon: CreditCard,
    accent: "border-border/70 hover:border-primary/40",
    badge: null,
    cta: "Požiadať o limitovaný pas",
    testid: "button-select-metered",
    features: ["12 hier celkovo", "Bez časového limitu", "Štandardný katalóg", "Podpora do 24h"],
  },
  {
    id: "unlimited" as const,
    name: "Neobmedzený",
    price: "14.99",
    period: "/ 4 mesiace",
    description: "Žiadosť o pas pre 100 hier počas 4 mesiacov.",
    icon: Infinity,
    accent: "border-primary/40 shadow-lg shadow-primary/10",
    badge: "Odporúčané",
    cta: "Požiadať o neobmedzený pas",
    testid: "button-select-unlimited",
    features: ["100 hier celkovo", "Platnosť 4 mesiace", "Prioritná podpora"],
  },
];

export default function Passes() {
  const { data: requests = [], isLoading } = usePassRequests();
  const requestPass = useRequestPass();
  const cancelRequest = useCancelPassRequest();
  const pendingRequest = requests.find((request) => request.status === "pending");
  const pendingPlan = PLANS.find((plan) => plan.id === pendingRequest?.pass_type);

  if (pendingRequest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="border border-border/60 bg-card p-10 max-w-md w-full flex flex-col items-center gap-6 rounded-[var(--radius-lg)]">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Žiadosť odoslaná</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tvoja žiadosť o <span className="font-semibold text-foreground">{pendingPlan?.name ?? pendingRequest.pass_type}</span> pas bola odoslaná.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-emerald-500/8 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Čaká sa na schválenie
          </div>
          <Button
            variant="outline"
            onClick={() => cancelRequest.mutate(pendingRequest.id)}
            disabled={cancelRequest.isPending}
            data-testid="button-cancel-request"
            className="mt-2 border-border text-muted-foreground hover:text-foreground text-sm w-full"
          >
            {cancelRequest.isPending ? "Ruším..." : "Zrušiť žiadosť"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {isLoading && !requests.length ? <PassesSkeleton /> : (
        <>
          <div className="border-b border-border/50 pb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Členské pasy</h1>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative bg-card border rounded-2xl p-6 sm:p-8 flex flex-col gap-6 transition-all duration-200 ${plan.accent}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md shadow-primary/30">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mt-3">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight text-foreground">{plan.price}</span>
                <span className="text-lg font-bold text-muted-foreground">EUR</span>
                {plan.period && (
                  <span className="text-muted-foreground text-sm font-mono">{plan.period}</span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-primary/15 border border-primary/30">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => requestPass.mutate(plan.id)}
                disabled={requestPass.isPending || isLoading}
                data-testid={plan.testid}
                className={`w-full h-11 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 mt-auto transition-all ${
                  plan.badge
                    ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                    : "bg-card hover:bg-primary/10 border border-border hover:border-primary/50 text-foreground"
                }`}
              >
                {requestPass.isPending ? "Odosielam..." : plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {requestPass.error && (
        <div className="max-w-3xl bg-red-500/5 border border-red-500/25 rounded-xl p-4 text-sm text-red-400">
          Nepodarilo sa odoslať žiadosť. Skúste to znova.
        </div>
      )}


      </>
      )}
    </div>
  );
}

