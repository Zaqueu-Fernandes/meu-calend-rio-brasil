import { createRoot } from "react-dom/client";
import "./index.css";
import { hasRecoveryParamsFromLocation, setRecoveryPending } from "@/lib/authRecovery";

if (hasRecoveryParamsFromLocation(window.location.search, window.location.hash)) {
  setRecoveryPending();
}

import("./App.tsx").then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(<App />);
});
