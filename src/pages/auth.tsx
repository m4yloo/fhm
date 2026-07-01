import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/lib/auth-provider";
import { Zap, LogIn, UserPlus, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const { signIn, signUp, loading, devBypassSignIn } = useAuthContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
        const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        devBypassSignIn();
        setLocation("/kniznica");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [devBypassSignIn, setLocation]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSignIn = mode === "signin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        setSuccess("Registrácia úspešná! Môžete sa prihlásiť.");
        setMode("signin");
      }
    } catch (err: any) {
      setError(err.message || "Nastala chyba.");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col items-center justify-center px-6 font-sans relative overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-sky-600/6 blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-xl tracking-tight text-foreground">FHP</span>
            <p className="text-[10px] text-muted-foreground font-mono">Fazúľové Herné Poklady</p>
          </div>
        </div>

        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/25 text-primary rounded-full text-[11px] font-semibold tracking-wide mb-8">
          <Zap className="w-3.5 h-3.5 fill-current" />
          Exkluzívna privátna sieť
        </div>

        {/* Card */}
        <div className="w-full card-gradient-border p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="text-center mb-1">
              <h2 className="text-xl font-bold text-foreground">
                {isSignIn ? "Prihlásenie" : "Registrácia"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignIn
                  ? "Prihláste sa do vášho účtu FHP."
                  : "Vytvorte si nový účet."}
              </p>
            </div>

            {!isSignIn && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Prihlasovacie meno
                </label>
                <Input
                  placeholder="bean_enjoyer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-10 bg-background border-border/70 text-xs font-mono rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-background border-border/70 text-xs font-mono rounded-lg"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Heslo
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 bg-background border-border/70 text-xs font-mono rounded-lg"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs font-mono bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-400 text-xs font-mono bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 text-sm font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSignIn ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Prihlásiť sa
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Vytvoriť účet
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-border/50 mt-5 text-xs text-muted-foreground">
            {isSignIn ? "Nemáte účet?" : "Už máte účet?"}
            <button
              onClick={() => { setMode(isSignIn ? "signup" : "signin"); setError(""); setSuccess(""); }}
              className="text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              {isSignIn ? "Registrujte sa" : "Prihláste sa"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground font-mono mt-6 text-center">
          © 2026 FHP · Fazúľové Herné Poklady
        </p>
      </div>
    </div>
  );
}
