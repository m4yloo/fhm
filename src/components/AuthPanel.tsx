import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-provider";
import { Eye, EyeOff } from "lucide-react";

type AuthPanelProps = {
  embedded?: boolean;
  onAuthenticated?: () => void;
};

export function AuthPanel({ embedded = false, onAuthenticated }: AuthPanelProps) {
  const { signIn, signInWithOAuth, signUp, loading, user } = useAuthContext();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isSignIn = mode === "signin";

  useEffect(() => {
    if (user && onAuthenticated) {
      onAuthenticated();
    }
  }, [user, onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        setSuccess("Registrácia úspešná! Potvrďte e-mail a prihláste sa.");
        setMode("signin");
      }
    } catch (err: any) {
      console.error("[auth]", err);
      const msg = err?.message || "Nastala chyba.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Nepodarilo sa pripojiť k serveru. Skontrolujte pripojenie k internetu alebo skúste neskôr.");
      } else if (msg.includes("Invalid login credentials")) {
        setError("Nesprávny e-mail alebo heslo.");
      } else if (msg.includes("Email not confirmed")) {
        setError("E-mail nebola potvrdená. Skontrolujte svoju schránku.");
      } else {
        setError("Nastala neočakávaná chyba. Skúste to znova.");
      }
    }
  };

  return (
    <div className="w-full max-w-[340px] flex flex-col items-center animate-[rise_0.5s_cubic-bezier(0.16,1,0.3,1)]">
      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        <h1 className="text-[19px] font-semibold text-foreground mb-1 text-center tracking-tight">
          {isSignIn ? "Prihlásenie do " : "Registrácia do "}
          <span className="text-[#9478ff]">FHP</span>
        </h1>
        <p className="text-[13.5px] text-muted-foreground mb-7 text-center">
          Fazuľové Herné Poklady
        </p>

        {/* OAuth row - placeholder for future implementation */}
        <div className="flex gap-2 mb-[18px]">
          <button
            type="button"
            onClick={() => signInWithOAuth("discord").catch((err: any) => setError(err.message || "Nastala chyba."))}
            className="flex-1 flex items-center justify-center gap-2 bg-[#151318] border border-[#242129] rounded-[10px] py-[11px] px-[10px] text-[13px] font-medium text-muted-foreground hover:border-[#3a3641] hover:text-foreground hover:bg-[#1a1720] active:scale-[0.97] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.001-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028Zm-12.243 10.9c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.845 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
            </svg>
            Discord
          </button>
          <button
            type="button"
            onClick={() => signInWithOAuth("google").catch((err: any) => setError(err.message || "Nastala chyba."))}
            className="flex-1 flex items-center justify-center gap-2 bg-[#151318] border border-[#242129] rounded-[10px] py-[11px] px-[10px] text-[13px] font-medium text-muted-foreground hover:border-[#3a3641] hover:text-foreground hover:bg-[#1a1720] active:scale-[0.97] transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Google
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#242129]" />
          <span className="text-[11px] text-[#57545e] tracking-[0.04em] whitespace-nowrap">alebo</span>
          <div className="flex-1 h-px bg-[#242129]" />
        </div>

        {!isSignIn && (
          <div className="mb-2.5">
            <input
              type="text"
              placeholder="Prihlasovacie meno"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#151318] border border-[#242129] rounded-[10px] py-[13px] px-[14px] text-[14px] text-foreground placeholder:text-[#57545e] outline-none focus:border-[#7c5cff] focus:bg-[#17151b] transition-all font-sans"
            />
          </div>
        )}

        <div className="mb-2.5">
          <input
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#151318] border border-[#242129] rounded-[10px] py-[13px] px-[14px] text-[14px] text-foreground placeholder:text-[#57545e] outline-none focus:border-[#7c5cff] focus:bg-[#17151b] transition-all font-sans"
          />
        </div>

        <div className="mb-2.5 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Heslo"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#151318] border border-[#242129] rounded-[10px] py-[13px] px-[14px] pr-10 text-[14px] text-foreground placeholder:text-[#57545e] outline-none focus:border-[#7c5cff] focus:bg-[#17151b] transition-all font-sans"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57545e] hover:text-[#9478ff] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs font-sans bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 mb-2.5">
            {error}
          </div>
        )}

        {success && (
          <div className="text-emerald-400 text-xs font-sans bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 mb-2.5">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full border-none rounded-[10px] py-[13px] px-[14px] text-[14px] font-semibold text-[#0a0a0d] bg-primary cursor-pointer hover:brightness-[1.08] active:scale-[0.98] transition-all mt-1 font-sans"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#0a0a0d] border-t-transparent rounded-full animate-spin mx-auto" />
          ) : isSignIn ? (
            "Prihlásiť sa"
          ) : (
            "Vytvoriť účet"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(isSignIn ? "signup" : "signin");
          setError("");
          setSuccess("");
        }}
        className="w-full mt-2.5 border border-[#242129] rounded-[10px] py-[12px] px-[14px] text-[13.5px] text-muted-foreground bg-transparent text-center hover:border-[#3a3641] hover:text-foreground transition-all font-sans"
      >
        {isSignIn ? "Nemáte účet? " : "Už máte účet? "}
        <b className="text-[#9478ff] font-semibold">
          {isSignIn ? "Registrujte sa" : "Prihláste sa"}
        </b>
        <span className="ml-0.5">→</span>
      </button>
    </div>
  );
}
