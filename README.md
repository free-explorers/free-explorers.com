# free-explorers.com

The Free Explorers website: one long sea at night. The lighthouse church from the Veshell
teaser stands on the left, and every member of the [Open Collective](https://opencollective.com/free-explorers)
sails a boat whose size follows their tier (Founder, Yearly, Monthly, one-time). The menu on
the right slides the sea along to the other pages (Veshell, Architects).

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/, deployed to GitHub Pages by .github/workflows/deploy.yaml
```

- `src/scene/Lighthouse.tsx`, `Outpost.tsx`, `freeExplorersPaths.ts`: ported from the teaser
  (`veshell_video/teaser/src`).
- `public/veshell-boat.svg`: the teaser's house-boat, exported with
  `node scripts/export-veshell-boat.mjs <path to veshell_video/teaser>`.
- Members are fetched live from `opencollective.com/free-explorers/members/all.json`;
  `npm run members:snapshot` refreshes the bundled fallback in `src/data/`.
