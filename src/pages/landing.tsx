import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0d] text-foreground flex flex-col items-center justify-center px-6 font-sans relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-sky-600/6 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Logo with glow */}
        <div className="w-[42px] h-[42px] mb-6 relative">
          <div className="absolute inset-0 bg-primary/40 blur-[16px] rounded-full" />
          <Logo size={42} className="relative" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-1">FHP</h1>
        <p className="text-[11px] text-muted-foreground font-mono mb-8">Fazuľové Herné Poklady</p>

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => setLocation("/kniznica")}
            className="w-full max-w-xs mx-auto h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            Vstúpiť do katalógu
          </Button>
        </div>

        <footer className="mt-10 text-[10px] text-muted-foreground font-mono text-center">
          © 2026 FHP · Fazuľové Herné Poklady
        </footer>
      </div>
    </div>
  );
}
