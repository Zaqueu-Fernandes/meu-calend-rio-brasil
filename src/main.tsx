import { createRoot } from "react-dom/client";

// Debug: verificar variáveis de ambiente antes de importar o App
console.log("ENV DEBUG:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "SET" : "MISSING",
  VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  ALL_ENV: import.meta.env,
});

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
