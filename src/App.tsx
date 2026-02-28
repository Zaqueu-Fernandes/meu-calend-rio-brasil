import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// MeuCalendario App

const RECOVERY_FLAG_KEY = "auth_recovery_pending_at";
const RECOVERY_FLAG_TTL_MS = 30 * 60 * 1000;

const RecoveryRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const markRecoveryPending = () => {
    sessionStorage.setItem(RECOVERY_FLAG_KEY, Date.now().toString());
  };

  const hasValidRecoveryFlag = () => {
    const rawValue = sessionStorage.getItem(RECOVERY_FLAG_KEY);
    if (!rawValue) return false;

    const timestamp = Number(rawValue);
    const isExpired = Number.isNaN(timestamp) || Date.now() - timestamp > RECOVERY_FLAG_TTL_MS;

    if (isExpired) {
      sessionStorage.removeItem(RECOVERY_FLAG_KEY);
      return false;
    }

    return true;
  };

  const hasRecoveryParams = () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    return (
      hash.includes("type=recovery") ||
      hash.includes("access_token=") ||
      hash.includes("token_hash=") ||
      params.get("type") === "recovery" ||
      params.has("code")
    );
  };

  const redirectToResetPassword = () => {
    if (location.pathname === "/reset-password") return;

    navigate(
      {
        pathname: "/reset-password",
        search: window.location.search,
        hash: window.location.hash,
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (hasRecoveryParams()) {
      markRecoveryPending();
    }

    if (location.pathname === "/" && (hasRecoveryParams() || hasValidRecoveryFlag())) {
      redirectToResetPassword();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markRecoveryPending();
        redirectToResetPassword();
        return;
      }

      if (event === "SIGNED_IN" && location.pathname === "/" && (hasRecoveryParams() || hasValidRecoveryFlag())) {
        redirectToResetPassword();
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <RecoveryRedirectHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />
          {/* O asterisco captura qualquer rota não encontrada dentro do basename */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
