// Exports the Veshell house-boat from the teaser (veshell_video/teaser) as a static SVG.
// Usage: node scripts/export-veshell-boat.mjs <path to veshell_video/teaser>
// It bundles the teaser's HouseDrawing with the teaser's own esbuild and React, renders it
// to markup, strips the sea (the site draws its own) and crops the viewBox to the boat.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const teaser = resolve(process.argv[2] ?? "../veshell_video/teaser");
const require = createRequire(join(teaser, "package.json"));
const esbuild = require("esbuild");

const entry = `
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HouseDrawing, __boat } from "./src/shots/IntroHouse";
export const markup = renderToStaticMarkup(
  React.createElement(HouseDrawing, { boat: 1, time: -1000, iconsReal: 0, sail: 0, wake: 0, tilt: 0 })
);
export const boat = __boat;
`;
// IntroHouse keeps the boat's geometry private: expose it to this bundle only.
const exposeGeometry = {
  name: "expose-geometry",
  setup(build) {
    build.onLoad({ filter: /IntroHouse\.tsx$/ }, (args) => ({
      contents: readFileSync(args.path, "utf8") + "\nexport const __boat = { STERN, BOW, KEEL, MAST, WATER, LIGHTHOUSE };\n",
      loader: "tsx",
    }));
  },
};
const out = join(mkdtempSync(join(tmpdir(), "fe-boat-")), "boat.mjs");
await esbuild.build({
  stdin: { contents: entry, resolveDir: teaser, loader: "tsx" },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  jsx: "automatic",
  plugins: [exposeGeometry],
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  logLevel: "warning",
});
const { markup, boat } = await import(pathToFileURL(out).href);

// Drop the full-width sea bands (the paths that start at x -30000).
let svg = markup.replace(/<path d="M -30000[^"]*"[^>]*>(<\/path>)?/g, "");
// Crop to the boat: from just behind the stern to past the bow, mast top to keel.
const pad = 120;
const x0 = boat.STERN - 900, x1 = boat.BOW.x + pad;
const y0 = boat.MAST.top - 80, y1 = boat.KEEL + pad;
// Keep only what lies right of the island (everything up to the island's quay is left of STERN - 900).
svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}"><defs><clipPath id="boat-crop"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#boat-crop)">${svg}</g></svg>`;
writeFileSync("public/veshell-boat.svg", svg);
const meta = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, water: boat.WATER, stern: boat.STERN, bow: boat.BOW.x, lighthouseX: boat.LIGHTHOUSE.x };
writeFileSync("src/data/veshell-boat.json", JSON.stringify(meta, null, 2) + "\n");
console.log(meta, `${(svg.length / 1024).toFixed(0)} KB`);
