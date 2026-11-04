import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BEAM_COUNT, BEAM_STEP } from "./scene/Lighthouse";
import { BOTTOM, World, beamY } from "./scene/World";
import { BoatShape } from "./scene/Boat";
import { BOATS, COLLECTIVE, useMembers, type BoatKind, type Member } from "./members";
import { JoinFleet } from "./JoinFleet";

// The site is one long sea: each page is a stretch of it, and the menu slides the camera
// along to the page's stretch. The title and the menu stay put on the right.

type PageId = "explorers" | "veshell" | "architects";
const PAGES: { id: PageId; label: string }[] = [
  { id: "explorers", label: "The Explorers" },
  { id: "veshell", label: "Veshell" },
  { id: "architects", label: "Architects" },
];
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
  const index = PAGES.findIndex((p) => p.id === page);
  // Restart the sweep when the camera arrives back at the lighthouse.
  const [sweep, setSweep] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (page !== "explorers") return;
    const t = setTimeout(() => setSweep((s) => s + 1), reduced ? 0 : SLIDE_MS * 0.6);
    return () => clearTimeout(t);
  }, [page, reduced]);
  const beamTime = useBeamSweep(sweep, reduced);

  // Arrow keys move between pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : -1;
      if (next >= 0 && next < PAGES.length) window.location.hash = `/${PAGES[next].id}`;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

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

  // The text column's width, in world units, so the scene keeps clear of it.
  const columnPx = frame.narrow ? 0 : Math.min(440, frame.w * 0.34);
  // The title sits in the middle of the lighthouse's beam: its centre on the beam's centre
  // line (measured once the font is in; phones keep it at the top).
  const wordmark = useRef<HTMLAnchorElement>(null);
  const [titleBox, setTitleBox] = useState({ w: 0, h: 0, right: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const el = wordmark.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTitleBox({ w: r.width, h: r.height, right: window.innerWidth - r.right });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [frame.w, frame.h, frame.narrow]);
  const titleTop = (() => {
    if (frame.narrow || !titleBox.w) return 0;
    const cx = frame.w - titleBox.right - titleBox.w / 2;
    const y = (beamY(cx / frame.unit, frame.pageW) - (BOTTOM - frame.height)) * frame.unit;
    return Math.max(0, y - titleBox.h / 2 - COLUMN_TOP);
  })();
  const reserveRight = columnPx / frame.unit;
  const active = members.filter((m) => m.active).length;

  return (
    <div className="site">
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
          width: frame.w * PAGES.length,
          transform: `translateX(${-index * frame.w}px)`,
          transition: resizing || reduced ? "none" : `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
        }}
      >
        <svg
          className="scene"
          viewBox={`0 ${BOTTOM - frame.height} ${frame.pageW * PAGES.length} ${frame.height}`}
          preserveAspectRatio="xMinYMax slice"
          role="img"
          aria-label="The Free Explorers lighthouse church by the sea, with a boat for every member of the collective"
        >
          <World pageW={frame.pageW} pages={PAGES.length} members={members} beamTime={beamTime} reserveRight={reserveRight} page={index} />
        </svg>
      </div>

      <aside className="column" style={frame.narrow ? undefined : { width: columnPx }}>
        <header className="title" style={{ marginTop: titleTop }}>
          <a ref={wordmark} href="#/explorers" className="wordmark">
            Free Explorers
          </a>
          <p className="tagline">Funding the open-source projects of tomorrow</p>
        </header>
        <nav className="menu" aria-label="Pages">
          {PAGES.map((p, i) => (
            <a key={p.id} href={`#/${p.id}`} aria-current={p.id === page ? "page" : undefined}>
              <span className="menu-index">{String(i + 1).padStart(2, "0")}</span>
              {p.label}
            </a>
          ))}
        </nav>
        <div className="panels">
          <Panel on={page === "explorers"}>
            <p>
              The Free Explorers are an <a href={COLLECTIVE}>Open Collective</a> funding and building open-source projects. Every boat on this sea is an Explorer
              backing the people who build them: the Architects.
            </p>
            <div className="count-row">
              <p className="count">
                <strong>{active}</strong> explorers at sea
              </p>
              <button type="button" className="cta" onClick={() => setJoin(null)}>
                Join the fleet
              </button>
            </div>
            <BoatLegend members={members} onPick={setJoin} />
          </Panel>
          <Panel on={page === "veshell"}>
            <h2>Veshell</h2>
            <p className="lead">Stop managing windows. Start exploring.</p>
            <p>
              Veshell is a Wayland compositor with a workflow built on our natural sense of space, to navigate and organise your digital environment. Each
              room of the boat is a workspace, each app has its place.
            </p>
            <div className="actions">
              <a className="cta" href="https://github.com/free-explorers/veshell" target="_blank" rel="noreferrer">
                Get Veshell
              </a>
              <a className="cta cta-ghost" href={`${COLLECTIVE}/projects/veshell`} target="_blank" rel="noreferrer">
                Fund Veshell
              </a>
            </div>
          </Panel>
          <Panel on={page === "architects"}>
            <h2>Architects</h2>
            <p>
              Architects dedicate their time to building the technologies of tomorrow. The collective funds them, so projects are delivered with care and
              stay alive for the long run.
            </p>
            <p>
              <a href="https://github.com/PapyElGringo">PapyElGringo</a> (Adrien Peslerbe) is a front-end developer and UX architect, leading the Veshell
              project to change how we interact with our digital environment.
            </p>
          </Panel>
        </div>
        <footer className="links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </footer>
      </aside>
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

const Panel: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <section className={`panel${on ? " panel-on" : ""}`} aria-hidden={!on} inert={!on}>
    {children}
  </section>
);

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
