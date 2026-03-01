import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  getRuntimeBasePath,
  hasRecoveryParamsFromLocation,
  hasValidRecoveryFlag,
  setRecoveryPending,
} from "@/lib/authRecovery";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const configuredBase = import.meta.env.BASE_URL.replace(/\/$/, "");
const basename = getRuntimeBasePath(configuredBase);

// MeuCalendario App

const RecoveryRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    if (hasRecoveryParamsFromLocation()) {
      setRecoveryPending();
    }

    if (location.pathname === "/" && (hasRecoveryParamsFromLocation() || hasValidRecoveryFlag())) {
      redirectToResetPassword();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryPending();
        redirectToResetPassword();
        return;
      }

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session &&
        location.pathname === "/" &&
        (hasRecoveryParamsFromLocation() || hasValidRecoveryFlag())
      ) {
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
