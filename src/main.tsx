import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ROUTES, pageFromPath } from "./routes";
import "./styles.css";

// One address per page: old hash links (#/veshell) and variants (/veshell/, /veshell.html, an
// unknown path served the 404 page) are rewritten to the page's own path, keeping any
// query and in-page anchor.
{
  const { pathname, hash, search } = window.location;
  const legacy = hash.startsWith("#/") ? pageFromPath(hash.slice(1)) : null;
  const page = legacy ?? pageFromPath(pathname) ?? "explorers";
  const keepHash = legacy ? "" : hash;
  if (legacy || pathname !== ROUTES[page].path) window.history.replaceState(null, "", ROUTES[page].path + search + keepHash);
}

// The prerendered page (for crawlers and link previews) is replaced by the app.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
