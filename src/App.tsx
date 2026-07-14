import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthContext } from "@/lib/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageTransition } from "@/components/page-transition";
import { Layout } from "@/components/layout";

// ── Lazy-loaded pages ──
const AuthPage = lazy(() => import("@/pages/auth"));
const Library = lazy(() => import("@/pages/library"));
const GameDetail = lazy(() => import("@/pages/game"));
const Account = lazy(() => import("@/pages/account"));
const Ledger = lazy(() => import("@/pages/ledger"));
const Passes = lazy(() => import("@/pages/passes"));
const FAQ = lazy(() => import("@/pages/faq"));
const Admin = lazy(() => import("@/pages/admin"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));

const queryClient = new QueryClient();

function PageSpinner() {
  return (
    <div className="min-h-[50dvh] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** Wraps protected routes — redirects to /prihlasenie when unauthenticated. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) return <PageSpinner />;
  if (!user) return <Redirect to="/prihlasenie" />;
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        {/* ── Auth pages (exact paths, checked first) ── */}
        <Route path="/prihlasenie">
          <Suspense fallback={<PageSpinner />}>
            <PageTransition>
              <AuthPage />
            </PageTransition>
          </Suspense>
        </Route>

        <Route path="/registracia">
          <Suspense fallback={<PageSpinner />}>
            <PageTransition>
              <AuthPage />
            </PageTransition>
          </Suspense>
        </Route>

        {/* ── Landing page ── */}
        <Route path="/">
          <Suspense fallback={<PageSpinner />}>
            <PageTransition>
              <Landing />
            </PageTransition>
          </Suspense>
        </Route>

        {/* ── OAuth callback (popup) ── */}
        <Route path="/auth/callback">
          <AuthCallback />
        </Route>

        {/* ── Layout-wrapped pages (catch-all, last) ── */}
        <Route>
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<PageSpinner />}>
                  <AnimatePresence mode="wait">
                    <Switch key={location}>
                      <Route path="/kniznica">
                        <PageTransition><Library /></PageTransition>
                      </Route>
                      <Route path="/hra/:id">
                        <PageTransition><GameDetail /></PageTransition>
                      </Route>
                      <Route path="/ucet">
                        <PageTransition><Account /></PageTransition>
                      </Route>
                      <Route path="/dennik">
                        <PageTransition><Ledger /></PageTransition>
                      </Route>
                      <Route path="/pasy">
                        <PageTransition><Passes /></PageTransition>
                      </Route>
                      <Route path="/pomoc">
                        <PageTransition><FAQ /></PageTransition>
                      </Route>
                      <Route path="/admin">
                        <PageTransition><Admin /></PageTransition>
                      </Route>
                      <Route>
                        <PageTransition><NotFound /></PageTransition>
                      </Route>
                    </Switch>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        </Route>
      </Switch>
    </AnimatePresence>
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
