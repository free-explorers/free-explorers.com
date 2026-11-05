import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BEAM_COUNT, BEAM_STEP } from "./scene/Lighthouse";
import { BOTTOM, DIVE_TOP, World, beamY } from "./scene/World";
import { BoatShape } from "./scene/Boat";
import { BOATS, COLLECTIVE, useMembers, type BoatKind, type Member } from "./members";
import { JoinFleet } from "./JoinFleet";
import { ArchitectsContent, SECTIONS, VeshellContent } from "./Pages";

// The site is one long sea: each page is a stretch of it, and the menu slides the camera
// along to the page's stretch. The title and the menu stay put on the right.

type PageId = "explorers" | "veshell" | "architects";
// Two slots: the Explorers page (home), and one page to its right showing whichever other page
// you went to; from there you come back home before going elsewhere.
const SLOTS = 2;
const PAGES: { id: PageId; label: string }[] = [
  { id: "explorers", label: "The Explorers" },
  { id: "veshell", label: "Veshell" },
  { id: "architects", label: "Architects" },
];
// The pages to the right of the Explorers: their title, shown like the Free Explorers' one.
const SIDE_PAGES: Record<"veshell" | "architects", { title: string; tagline: string }> = {
  veshell: { title: "Veshell", tagline: "Stop managing windows. Start exploring." },
  architects: { title: "Architects", tagline: "The people building the technologies of tomorrow" },
};
const LINKS = [
  { label: "Open Collective", href: COLLECTIVE },
  { label: "GitHub", href: "https://github.com/free-explorers" },
  { label: "Discord", href: "https://discord.gg/vBb7D9a" },
];

const pageFromHash = (): PageId => {
  const id = window.location.hash.replace(/^#\/?/, "");
  return PAGES.some((p) => p.id === id) ? (id as PageId) : "explorers";
};

// The viewport, and the world's frame for it: 1000 units tall at its reference size,
// taller on narrow screens (more sky) so a page is never narrower than MIN_PAGE units.
const useFrame = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const narrow = size.w < 760;
  const minPage = narrow ? 820 : 1150;
  const aspect = size.w / size.h;
  const height = Math.max(1000, minPage / aspect);
  return { ...size, narrow, height, pageW: height * aspect, unit: size.h / height };
};

// The lighthouse's beams sweep once from left to right whenever the Explorers page comes
// into view; the last one stays lit over the sea.
const SWEEP_FRAMES = (BEAM_COUNT - 1) * BEAM_STEP + 40;
const useBeamSweep = (trigger: number, reduced: boolean) => {
  const [time, setTime] = useState(reduced ? SWEEP_FRAMES : 0);
  useEffect(() => {
    if (reduced) return setTime(SWEEP_FRAMES);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 1000) * 60;
      setTime(Math.min(t, SWEEP_FRAMES));
      if (t < SWEEP_FRAMES) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, reduced]);
  return time;
};

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
};

const SLIDE_MS = 1400;
// The depth shown under the sea, in metres.
const DEPTH_M = 40;
// Counts the gauge from 0 to DEPTH_M as the camera dives (in step with the slide), and back.
const useDepthGauge = (dived: boolean, reduced: boolean) => {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    const target = dived ? DEPTH_M : 0;
    if (reduced) return setDepth(target);
    let raf = 0;
    const from = depth;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SLIDE_MS);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setDepth(Math.round(from + (target - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dived, reduced]);
  return depth;
};
// The column's top padding (see .column).
const COLUMN_TOP = 40;

export const App: React.FC = () => {
  const frame = useFrame();
  const { members, refresh } = useMembers();
  // The join panel: undefined closed, null open on the default amount, or open on a boat
  // (its smallest amount).
  const [join, setJoin] = useState<BoatKind | null | undefined>(undefined);
  // After joining, fetch the fleet again now and once more a little later (Open Collective
  // can take a moment to list a new member).
  const refreshFleet = React.useCallback(() => {
    refresh();
    setTimeout(refresh, 8000);
  }, [refresh]);
  const reduced = useReducedMotion();
  const [page, setPage] = useState<PageId>(pageFromHash);
  const index = page === "explorers" ? 0 : 1;
  // What the right-hand slot shows: the page there, kept while sliding back home.
  const [side, setSide] = useState<Exclude<PageId, "explorers">>(() => (page === "explorers" ? "veshell" : page));
  const pageRef = useRef(page);
  pageRef.current = page;
  useEffect(() => {
    let wait = 0;
    const onHash = () => {
      clearTimeout(wait);
      const next = pageFromHash();
      const from = pageRef.current;
      // From one right-hand page straight to another: slide back home, then out again.
      if (from !== "explorers" && next !== "explorers" && next !== from) {
        setPage("explorers");
        wait = window.setTimeout(() => {
          setSide(next);
          setPage(next);
        }, SLIDE_MS + 80);
        return;
      }
      if (next !== "explorers") setSide(next);
      setPage(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      clearTimeout(wait);
    };
  }, []);
  // The beams sweep once, when the site opens; navigating doesn't replay them.
  const beamTime = useBeamSweep(0, reduced);

  // Under the sea, with the submarines (the dive button, or the up/down arrow keys).
  const [dived, setDived] = useState(false);

  // Arrow keys move between pages, and dive or surface.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowDown" && page === "explorers") setDived(true);
      if (e.key === "ArrowUp") setDived(false);
      // Under the sea, there's nowhere to go sideways: the depths are under the first page.
      if (dived) return;
      // Right: out to the last page visited on the right; left: back home.
      if (e.key === "ArrowRight" && index === 0) window.location.hash = `/${side}`;
      if (e.key === "ArrowLeft" && index === 1) window.location.hash = "/explorers";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, page, dived, side]);
  // The depths are only under the first page: leaving it surfaces.
  useEffect(() => {
    if (page !== "explorers") setDived(false);
  }, [page]);
  // The depth gauge counts down as the camera dives, and back up as it surfaces.
  const depth = useDepthGauge(dived, reduced);

  // No slide animation while the window is being resized (the page width changes).
  const [resizing, setResizing] = useState(false);
  const last = useRef(frame.pageW);
  useLayoutEffect(() => {
    if (last.current === frame.pageW) return;
    last.current = frame.pageW;
    setResizing(true);
    const t = setTimeout(() => setResizing(false), 150);
    return () => clearTimeout(t);
  }, [frame.pageW]);

  // How far the camera goes down when diving, in px, and the slide's timing (shared by the scene
  // and the column, which scrolls up with it).
  const diveDepth = Math.round((frame.height - (BOTTOM - DIVE_TOP)) * frame.unit);
  const diveY = dived ? diveDepth : 0;
  const slide = resizing || reduced ? "none" : `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
  // The text column's width, in world units, so the scene keeps clear of it.
  const columnPx = frame.narrow ? 0 : Math.min(440, frame.w * 0.34);
  // The title sits in the middle of the lighthouse's beam: its centre on the beam's centre
  // line (measured once the font is in; phones keep it at the top).
  const wordmark = useRef<HTMLAnchorElement>(null);
  const homeHeader = useRef<HTMLElement>(null);
  const [titleBox, setTitleBox] = useState({ w: 0, h: 0, header: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const el = wordmark.current;
      if (!el || !homeHeader.current) return;
      setTitleBox({ w: el.offsetWidth, h: el.offsetHeight, header: homeHeader.current.offsetHeight });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [frame.w, frame.h, frame.narrow]);
  // The interface's side margin, and the width of each half of the docked container.
  const edge = frame.narrow ? 16 : 48;
  // On wide screens the navigation is a vertical rail docked to the screen edge (each half
  // RAIL_W wide), the cards floating beside it; on phones a row across the top.
  const RAIL_W = 190;
  const GAP = 18;
  const halfW = frame.narrow ? frame.w - 16 : RAIL_W;
  const homeCardW = frame.narrow ? frame.w - edge * 2 : Math.min(400, frame.w * 0.3);
  // The navigation's top (under the titles), its height, and the cards' top under it.
  const navRef = useRef<HTMLElement>(null);
  const [navH, setNavH] = useState(54);
  useLayoutEffect(() => {
    if (navRef.current) setNavH(navRef.current.offsetHeight);
  });
  // The content column on the page to the right.
  const contentW = frame.narrow ? frame.w - edge * 2 : Math.min(620, frame.w * 0.42);
  const reserveLeft = frame.narrow ? 0 : (RAIL_W + GAP + contentW + GAP) / frame.unit;
  // Veshell's showcase: as wide as the page beside the rail.
  const showcaseW = frame.narrow ? contentW : Math.min(1100, frame.w - RAIL_W - GAP - edge);
  // The content: as long as it is; on its page the whole site scrolls (the browser's own
  // scrolling), the camera going down under the sea as you read. Scrolling to a section, and
  // the section being read.
  const contentRef = useRef<HTMLElement>(null);
  const [contentH, setContentH] = useState(0);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [side]);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(SECTIONS[side][0].id);
  useEffect(() => setActiveSection(SECTIONS[side][0].id), [side]);
  const followReading = () => {
    const box = contentRef.current;
    if (!box) return;
    const sections = [...box.querySelectorAll<HTMLElement>("[data-section]")];
    // The last section whose top has passed a third of the way down; the last one at the end.
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const line = window.innerHeight / 3;
    const current = atEnd ? sections[sections.length - 1] : sections.filter((s) => s.getBoundingClientRect().top <= line).pop() ?? sections[0];
    if (current?.dataset.section) setActiveSection(current.dataset.section);
  };
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      followReading();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });
  const scrollToSection = (id: string) => {
    const el = contentRef.current?.querySelector<HTMLElement>(`#section-${id}`);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: reduced ? "auto" : "smooth" });
  };
  // Back home: up to the surface while sliding.
  useEffect(() => {
    if (page === "explorers" && window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [page, reduced]);
  const titleTop = (() => {
    if (frame.narrow || !titleBox.w) return 0;
    const cx = frame.w - edge - titleBox.w / 2;
    const y = (beamY(cx / frame.unit, frame.pageW) - (BOTTOM - frame.height)) * frame.unit;
    return Math.max(0, y - titleBox.h / 2 - COLUMN_TOP);
  })();
  const reserveRight = frame.narrow ? 0 : (RAIL_W + GAP + homeCardW + GAP) / frame.unit;
  const dockTop = COLUMN_TOP + titleTop + titleBox.header + (frame.narrow ? 14 : 28);
  const cardTop = frame.narrow ? dockTop + navH + 10 : dockTop;
  const active = members.filter((m) => m.active).length;
  const below = members.length - active;
  // The site's height: the screen at home, the content's length on the page to the right; the
  // scene (sky, sea, depths) as tall as that, and at least the dive's depth.
  const docH = index === 1 ? Math.max(frame.h, Math.ceil(cardTop + contentH + 96)) : frame.h;
  const sceneH = Math.max((frame.height * 2 - (BOTTOM - DIVE_TOP)) * frame.unit, docH);
  const seabed = BOTTOM - frame.height + sceneH / frame.unit;
  useEffect(() => {
    document.documentElement.classList.toggle("scrolling", index === 1);
  }, [index]);
  // The navigation rail stays on screen: it rises to the top as the title scrolls away.
  const railTop = Math.max(frame.narrow ? 8 : 16, dockTop - scrollY);

  return (
    <div className="site" style={{ height: docH }}>
      <svg className="sky" viewBox={`0 ${BOTTOM - frame.height} ${frame.pageW} ${frame.height}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3a4c" />
            <stop offset="0.75" stopColor="#3d6c82" />
            <stop offset="1" stopColor="#4f8399" />
          </linearGradient>
        </defs>
        <rect x={0} y={BOTTOM - frame.height} width={frame.pageW} height={frame.height} fill="url(#sky)" />
        <Stars w={frame.pageW} top={BOTTOM - frame.height} />
      </svg>
      {/* The whole sea, every page side by side, on a strip that slides along by a page
          width: the slide is an HTML transform, which the browser composites at full
          resolution (a CSS transform inside the SVG can come out blurred). */}
      <div
        className="scene-track"
        style={{
          width: frame.w * SLOTS,
          height: sceneH,
          transform: `translate(${-index * frame.w}px, ${-diveY}px)`,
          transition: slide,
        }}
      >
        <svg
          className="scene"
          viewBox={`0 ${BOTTOM - frame.height} ${frame.pageW * SLOTS} ${sceneH / frame.unit}`}
          preserveAspectRatio="xMinYMin slice"
          role="img"
          aria-label="The Free Explorers lighthouse church by the sea, with a boat for every member of the collective"
        >
          <World
            pageW={frame.pageW}
            pages={SLOTS}
            side={side}
            members={members}
            beamTime={beamTime}
            reserveRight={reserveRight}
            reserveLeft={reserveLeft}
            page={index}
            onPick={setJoin}
            height={frame.height}
            seabed={seabed}
            dived={dived}
          />
        </svg>
      </div>
      {/* Dive under the sea, or surface: a porthole button at the bottom */}
      {/* The underwater card: in the depths, on the right, rising into view with the dive */}
      <section
        className="depth-card panel"
        style={{
          visibility: dived || index === 0 ? undefined : "hidden",
          top: diveDepth + (frame.narrow ? 110 : 140),
          ...(frame.narrow ? {} : { width: columnPx - 48 }),
          transform: `translateY(${-diveY}px)`,
          transition: slide,
        }}
        inert={!dived}
        aria-hidden={!dived}
      >
        <h2>Under the sea</h2>
        <p>
          Down here cruise the explorers who gave once, and those who used to give every month. Each submarine is sized by all its explorer has given: thank you,
          every one of you.
        </p>
        <p className="count">
          <strong>{below}</strong> {below === 1 ? "submarine" : "submarines"} below
        </p>
        <button type="button" className="cta" onClick={() => setJoin(null)}>
          Come up and join the fleet
        </button>
      </section>
      {/* Dive: a button at the bottom that, as the camera dives, travels to the top of the screen
          and morphs into the depth gauge with a Surface arrow */}
      <button
        type="button"
        className={`dive${dived ? " dive-under" : ""}`}
        inert={index !== 0}
        onClick={() => setDived((d) => !d)}
        aria-label={dived ? `Depth ${depth} metres. Surface` : "Dive under the sea"}
        style={{ transform: `translateX(calc(-50% - ${index * frame.w}px))`, transitionDuration: reduced ? "0s" : `${SLIDE_MS}ms` }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={dived ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
        </svg>
        {dived || depth > 0 ? (
          <span className="dive-depth">
            <span className="depth-label">Depth</span>
            <span className="depth-value">{depth} m</span>
          </span>
        ) : (
          <span>{`Dive · ${below} below`}</span>
        )}
        {dived && <span className="dive-surface">Surface</span>}
      </button>

      {/* The interface, attached to the pages: it slides with the view and scrolls up with the
          dive. The home page's title on the right; the page to the right's title on its left;
          between them, on the edge between the two pages, the docked container split in two:
          its left half (home's menu and text) docked to the right edge on the home page, its
          right half (the way back and the page's text) docked to the left edge on the other. */}
      <div
        className="ui-track"
        style={{ width: frame.w * SLOTS, transform: `translate(${-index * frame.w}px, ${-diveY}px)`, transition: slide }}
        inert={dived}
        aria-hidden={dived}
      >
        <header ref={homeHeader} className="title title-home" style={{ top: COLUMN_TOP + titleTop, right: frame.w + edge }} inert={index !== 0}>
          <a ref={wordmark} href="#/explorers" className="wordmark">
            Free Explorers
          </a>
          <p className="tagline">Funding the open-source projects of tomorrow</p>
        </header>
        <header className="title title-side" style={{ top: COLUMN_TOP + titleTop, left: frame.w + edge }} inert={index !== 1}>
          <span className="wordmark">{SIDE_PAGES[side].title}</span>
          <p className="tagline">{SIDE_PAGES[side].tagline}</p>
        </header>
        {/* The Explorers' card, under the navigation on the right */}
        <section
          className="card card-home"
          style={{ top: cardTop, right: frame.narrow ? frame.w + edge : frame.w + RAIL_W + GAP, width: homeCardW }}
          inert={index !== 0}
        >
          <p>
            The Free Explorers are an <a href={COLLECTIVE}>Open Collective</a> funding and building open-source projects. Every boat on this sea is an Explorer
            backing the people who build them: the Architects.
          </p>
          <div className="count-row">
            <p className="count">
              <strong>{active}</strong> {active === 1 ? "explorer" : "explorers"} at sea
            </p>
            <button type="button" className="cta" onClick={() => setJoin(null)}>
              Join the fleet
            </button>
          </div>
          <BoatLegend members={members} onPick={setJoin} />
        </section>
        {/* The page's content, on the left of the page to the right, as long as it is */}
        <article
          key={side}
          className={`card card-content${side === "veshell" ? " card-showcase" : ""}`}
          ref={contentRef}
          style={{ top: cardTop, left: frame.narrow ? frame.w + edge : frame.w + RAIL_W + GAP, width: side === "veshell" ? showcaseW : contentW }}
          inert={index !== 1}
          tabIndex={index === 1 ? 0 : -1}
          onClick={(e) => {
            // Links to a section scroll the column (they'd otherwise change the page).
            const a = (e.target as HTMLElement).closest("a");
            const href = a?.getAttribute("href") ?? "";
            if (href.startsWith("#section-")) {
              e.preventDefault();
              scrollToSection(href.slice("#section-".length));
            }
          }}
        >
          {side === "veshell" ? <VeshellContent /> : <ArchitectsContent />}
        </article>
      </div>
      {/* The navigation rail: slides with the pages and dives with the camera, but stays on
          screen while the page to the right scrolls */}
      <div
        className="rail-track"
        style={{ width: frame.w * SLOTS, transform: `translate(${-index * frame.w}px, ${-diveY}px)`, transition: slide }}
        inert={dived}
        aria-hidden={dived}
      >
          {/* Navigation: one container on the edge between the two pages, split there: home's
              links (docked to the right edge on the home page), the way back (docked to the left
              edge on the other) */}
          <nav
            ref={navRef}
            className="dock"
            style={{ left: frame.w - halfW, width: halfW * 2, top: railTop, ...(frame.narrow ? {} : { height: `calc(100% - ${railTop + 84}px)` }) }}
            aria-label="Pages"
          >
            <div className="dock-half dock-home" inert={index !== 0}>
              {PAGES.filter((p) => p.id !== "explorers").map((p) => (
                <a key={p.id} href={`#/${p.id}`}>
                  {p.label}
                  <span className="menu-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </div>
            <div className="dock-half dock-side" inert={index !== 1}>
              <a href="#/explorers">
                <span className="menu-arrow" aria-hidden="true">
                  ←
                </span>
                The Explorers
              </a>
              {/* The page's sections: scrolls the content to one, and follows the reading */}
              {!frame.narrow && (
                <ol className="toc">
                  {SECTIONS[side].map((sec) => (
                    <li key={sec.id}>
                      <button type="button" aria-current={sec.id === activeSection ? "location" : undefined} onClick={() => scrollToSection(sec.id)}>
                        {sec.label}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </nav>
      </div>
      {/* The footer links, attached to the camera: they stay put when sliding and diving */}
      <footer className="links links-fixed" style={{ right: edge }}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </footer>
      <JoinFleet
        open={join}
        onJoined={refreshFleet}
        onClose={() => {
          setJoin(undefined);
          refreshFleet();
        }}
      />
    </div>
  );
};

// The boats explorers sail, from the galleon down, with their amounts and how many sail each
// now; each one opens the join panel on its amounts.
const BoatLegend: React.FC<{ members: Member[]; onPick: (boat: BoatKind) => void }> = ({ members, onPick }) => (
  <ul className="legend">
    {BOATS.map((b) => {
      const n = members.filter((m) => m.active && m.boat === b.id).length;
      return (
        <li key={b.id}>
          <button type="button" onClick={() => onPick(b.id)} aria-label={`Join with a ${b.name} (${b.range} a month)`}>
            <svg viewBox={b.id === "galleon" ? "-330 -440 680 500" : "-170 -330 340 360"} aria-hidden="true">
              <BoatShape kind={b.id} uid={`legend-${b.id}`} />
            </svg>
            <span>{b.name}</span>
            <span className="legend-range">{b.range} / mo</span>
            <span className="legend-n">{n}</span>
          </button>
        </li>
      );
    })}
  </ul>
);

// A few faint stars, fixed in the sky (they don't slide with the sea).
const Stars: React.FC<{ w: number; top: number }> = ({ w, top }) => {
  const stars = React.useMemo(() => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 70 }, () => ({ x: rnd() * w, y: top + rnd() * (560 - top), r: 0.6 + rnd() * 1.4, o: 0.2 + rnd() * 0.5, d: rnd() * 5 }));
  }, [w, top]);
  return (
    <g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8f4f8" opacity={s.o} className="star" style={{ animationDelay: `${-s.d}s` }} />
      ))}
    </g>
  );
};
