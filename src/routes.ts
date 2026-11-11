// The site's pages: their address, and what search engines and link previews show for them.
// Shared by the app (which updates the head as you navigate) and the build's prerender (which
// writes one HTML file per page, see scripts/prerender.mjs).

export const SITE = "https://free-explorers.com";

export type PageId = "explorers" | "veshell" | "architects";
export type SidePageId = Exclude<PageId, "explorers">;

export type Route = {
  path: string;
  label: string;
  // The page's heading and tagline, as shown in its title on the sea.
  heading: string;
  tagline: string;
  // The document title and the description shown in search results.
  title: string;
  description: string;
  // The link preview image (1200×630), from public/.
  image: string;
  imageAlt: string;
};

export const ROUTES: Record<PageId, Route> = {
  explorers: {
    path: "/",
    label: "The Explorers",
    heading: "Free Explorers",
    tagline: "Funding the open-source projects of tomorrow",
    title: "Free Explorers · Funding the open-source projects of tomorrow",
    description:
      "Free Explorers is an Open Collective funding and building open-source projects like Veshell. Every boat on our sea is a member backing the developers who build them.",
    image: "/og/explorers.png",
    imageAlt: "The Free Explorers lighthouse church by a night sea, with a boat for every member of the collective",
  },
  veshell: {
    path: "/veshell",
    label: "Veshell",
    heading: "Veshell",
    tagline: "Stop managing windows. Start exploring.",
    title: "Veshell · A spatial not-desktop environment for Linux",
    description:
      "Veshell lays your Linux apps out on a map you learn by heart: workspaces as rows, windows as columns, moved with W A S D. It remembers your layout across reboots. Free and open source.",
    image: "/og/veshell.jpg",
    imageAlt: "A frame from the Veshell teaser",
  },
  architects: {
    path: "/architects",
    label: "Architects",
    heading: "Architects",
    tagline: "The people building the technologies of tomorrow",
    title: "Architects · Free Explorers",
    description:
      "Architects are the developers the Free Explorers collective funds to build open-source technologies with care, and keep them alive for the long run.",
    image: "/og/architects.png",
    imageAlt: "The Free Explorers' night sea, on the Architects page",
  },
};

export const PAGE_IDS = Object.keys(ROUTES) as PageId[];

// The page at a path ("/veshell", "/veshell/", "/veshell.html"); null for an unknown one.
export const pageFromPath = (pathname: string): PageId | null => {
  const clean = "/" + pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "").replace(/^index$/, "");
  return PAGE_IDS.find((id) => ROUTES[id].path === clean) ?? null;
};

// Keeps the head in step with the page shown (title, description, canonical, previews).
export const applyHead = (page: PageId) => {
  const r = ROUTES[page];
  const url = SITE + r.path;
  document.title = r.title;
  const set = (selector: string, attr: string, value: string) => document.head.querySelector(selector)?.setAttribute(attr, value);
  set('meta[name="description"]', "content", r.description);
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:url"]', "content", url);
  set('meta[property="og:title"]', "content", r.title);
  set('meta[property="og:description"]', "content", r.description);
  set('meta[property="og:image"]', "content", SITE + r.image);
  set('meta[property="og:image:alt"]', "content", r.imageAlt);
  set('meta[name="twitter:title"]', "content", r.title);
  set('meta[name="twitter:description"]', "content", r.description);
  set('meta[name="twitter:image"]', "content", SITE + r.image);
};
