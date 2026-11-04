import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base, so the build works at the domain root or under a GitHub Pages path.
export default defineConfig({ base: "./", plugins: [react()] });
