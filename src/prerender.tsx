// Built for Node by `vite build --ssr` (see scripts/prerender.mjs): each page's content as
// plain HTML, put in the page's file so search engines and link previews read it without
// running the app. The app replaces it as soon as it starts.
import { renderToStaticMarkup } from "react-dom/server";
import { COLLECTIVE } from "./members";
import { ArchitectsContent, HomeIntro, VeshellContent } from "./Pages";
import { PAGE_IDS, ROUTES, type PageId } from "./routes";

export { ROUTES, PAGE_IDS, SITE } from "./routes";
export { MEDIA_BASE, TEASER, TEASER_POSTER } from "./Pages";

const LINKS = [
  { label: "Open Collective", href: COLLECTIVE },
  { label: "GitHub", href: "https://github.com/free-explorers" },
  { label: "Discord", href: "https://discord.gg/vBb7D9a" },
];

const StaticPage = ({ page }: { page: PageId }) => (
  <div className="static-page">
    <header>
      <h1>{ROUTES[page].heading}</h1>
      <p className="tagline">{ROUTES[page].tagline}</p>
    </header>
    <nav aria-label="Pages">
      {PAGE_IDS.map((id) => (
        <a key={id} href={ROUTES[id].path} aria-current={id === page ? "page" : undefined}>
          {ROUTES[id].label}
        </a>
      ))}
    </nav>
    <main>{page === "explorers" ? <HomeIntro /> : page === "veshell" ? <VeshellContent /> : <ArchitectsContent />}</main>
    <footer>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href}>
          {l.label}
        </a>
      ))}
    </footer>
  </div>
);

export const render = (page: PageId) => renderToStaticMarkup(<StaticPage page={page} />);
