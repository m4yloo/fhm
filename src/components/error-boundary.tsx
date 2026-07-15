import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <div className="max-w-md w-full bg-card border border-border/60 rounded-2xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Niečo sa pokazilo</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {this.state.error ? "Neočakávaná chyba pri vykresľovaní stránky." : "Neočakávaná chyba pri vykresľovaní stránky."}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Skúsiť znova
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
