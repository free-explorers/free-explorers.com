// After `vite build`: writes one HTML file per page into dist/ (index.html, veshell.html,
// architects.html; GitHub Pages serves /veshell from veshell.html), each with its own title,
// description, canonical, link previews, structured data and prerendered content; then
// 404.html, sitemap.xml and robots.txt. Needs the SSR build of src/prerender.tsx in dist-ssr/.
import { readFile, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const ssr = path.join(root, "dist-ssr");
const { render, ROUTES, PAGE_IDS, SITE, MEDIA_BASE, TEASER, TEASER_POSTER } = await import(pathToFileURL(path.join(ssr, "prerender.js")).href);

const template = await readFile(path.join(dist, "index.html"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const today = new Date().toISOString().slice(0, 10);

const ORG = {
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "Free Explorers",
  url: `${SITE}/`,
  logo: `${SITE}/og/logo.png`,
  description: ROUTES.explorers.description,
  sameAs: ["https://opencollective.com/free-explorers", "https://github.com/free-explorers", "https://discord.gg/vBb7D9a"],
};

// Structured data (schema.org) for each page.
const structuredData = (page) => {
  const r = ROUTES[page];
  const url = SITE + r.path;
  const webPage = { "@type": "WebPage", "@id": `${url}#webpage`, url, name: r.title, description: r.description, isPartOf: { "@id": `${SITE}/#website` } };
  const graph = [ORG, { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Free Explorers", publisher: { "@id": ORG["@id"] } }, webPage];
  if (page !== "explorers")
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Free Explorers", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: r.heading, item: url },
      ],
    });
  if (page === "veshell") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name: "Veshell",
      url,
      description: r.description,
      applicationCategory: "DesktopEnhancementApplication",
      operatingSystem: "Linux",
      license: "https://www.gnu.org/licenses/gpl-3.0.html",
      image: SITE + r.image,
      sameAs: ["https://github.com/free-explorers/veshell", "https://opencollective.com/free-explorers/projects/veshell"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": ORG["@id"] },
    });
    if (TEASER)
      graph.push({
        "@type": "VideoObject",
        name: "Veshell teaser",
        description: "Veshell, the not-desktop environment for Linux, in a short teaser.",
        thumbnailUrl: SITE + TEASER_POSTER,
        // The MP4: the one every player reads.
        contentUrl: `${MEDIA_BASE || SITE}/${TEASER.mp4}`,
        uploadDate: process.env.TEASER_UPLOAD_DATE ?? "2026-11-11",
        publisher: { "@id": ORG["@id"] },
      });
    webPage.mainEntity = { "@id": `${url}#software` };
  }
  return { "@context": "https://schema.org", "@graph": graph };
};

const head = (page, { canonical = true } = {}) => {
  const r = ROUTES[page];
  const url = SITE + r.path;
  const image = SITE + r.image;
  return [
    canonical ? `<link rel="canonical" href="${url}" />` : `<meta name="robots" content="noindex" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Free Explorers" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(r.imageAlt)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(r.imageAlt)}" />`,
    canonical ? `<script type="application/ld+json">${JSON.stringify(structuredData(page)).replace(/</g, "\\u003c")}</script>` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
};

const page = (id, { title, description, body, canonical } = {}) => {
  const r = ROUTES[id];
  const out = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title ?? r.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description ?? r.description)}" />`)
    .replace("<!--seo-->", head(id, { canonical }))
    .replace("<!--app-->", body ?? render(id));
  for (const marker of ["<!--seo-->", "<!--app-->"]) if (out.includes(marker)) throw new Error(`prerender: ${marker} left in ${id}`);
  return out;
};

for (const id of PAGE_IDS) {
  const file = id === "explorers" ? "index.html" : `${ROUTES[id].path.slice(1)}.html`;
  await writeFile(path.join(dist, file), page(id));
}
// Unknown addresses: the app at home (it rewrites the address), not indexed.
await writeFile(path.join(dist, "404.html"), page("explorers", { title: "Page not found · Free Explorers", canonical: false, body: "" }));
await writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGE_IDS.map((id) => `  <url><loc>${SITE}${ROUTES[id].path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`,
);
await writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
await rm(ssr, { recursive: true, force: true });
console.log(`prerendered ${PAGE_IDS.length} pages, 404.html, sitemap.xml, robots.txt`);
