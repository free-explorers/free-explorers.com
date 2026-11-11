import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the domain root (free-explorers.com): every page has its own path (/veshell),
// so assets are addressed from the root too.
export default defineConfig({ base: "/", plugins: [react()] });
