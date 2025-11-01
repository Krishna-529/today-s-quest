import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    if (confirm("New update available. Reload?")) location.reload();
  },
  onOfflineReady() {
    console.log("App ready for offline use.");
  },
});
