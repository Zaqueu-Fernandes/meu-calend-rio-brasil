import { createRoot } from "react-dom/client";
import "./index.css";

const RECOVERY_FLAG_KEY = "auth_recovery_pending_at";
const recoveryUrlPattern = /(type=recovery|access_token=|token_hash=|[?&]code=)/;

if (recoveryUrlPattern.test(window.location.href)) {
  sessionStorage.setItem(RECOVERY_FLAG_KEY, Date.now().toString());
}

import("./App.tsx").then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(<App />);
});
