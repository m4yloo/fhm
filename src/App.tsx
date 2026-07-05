import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthContext } from "@/lib/auth-provider";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import AuthPage from "@/pages/auth";
import Library from "@/pages/library";
import GameDetail from "@/pages/game";
import Account from "@/pages/account";
import Ledger from "@/pages/ledger";
import Passes from "@/pages/passes";
import FAQ from "@/pages/faq";

const queryClient = new QueryClient();

/** Wraps protected routes — redirects to /prihlasenie when unauthenticated. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-[50dvh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/prihlasenie" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public — auth pages (DISABLED) */}
      {/* <Route path="/prihlasenie" component={AuthPage} /> */}
      {/* <Route path="/registracia" component={AuthPage} /> */}

      {/* Protected — wrapped in Layout */}
      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/" component={Library} />
              <Route path="/kniznica" component={Library} />
              <Route path="/hra/:id" component={GameDetail} />
              <Route path="/ucet" component={Account} />
              <Route path="/dennik" component={Ledger} />
              <Route path="/pasy" component={Passes} />
              <Route path="/pomoc" component={FAQ} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
