import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
//@ts-ignore
import "./index.css";
//@ts-ignore
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[SW] Registered: ", reg.scope))
      .catch((err) => console.log("[SW] Registration failed: ", err));
  });
}
