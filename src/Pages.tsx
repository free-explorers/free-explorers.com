import React from "react";
import { COLLECTIVE } from "./members";

// The content of the pages to the right of the Explorers, in a column that scrolls on its own.
// Each page is made of sections (with ids) that the navigation rail lists and follows.

export type SidePage = "veshell" | "architects";
export type Section = { id: string; label: string };
export const SECTIONS: Record<SidePage, Section[]> = {
  veshell: [
    { id: "teaser", label: "Teaser" },
    { id: "why", label: "Why Veshell" },
    { id: "map", label: "A map, not a desk" },
    { id: "move", label: "Move by direction" },
    { id: "remember", label: "It remembers" },
    { id: "overview", label: "The Overview" },
    { id: "play", label: "Play" },
    { id: "environment", label: "A whole environment" },
    { id: "install", label: "Install" },
    { id: "open", label: "Built in the open" },
  ],
  architects: [
    { id: "intro", label: "Architects" },
    { id: "how", label: "How it works" },
    { id: "who", label: "The Architects" },
    { id: "join", label: "Become one" },
  ],
};

// Where the videos are served from: "" for this site, or the address of a CDN pulling from it
// (e.g. a Bunny pull zone, "https://freeexplorers.b-cdn.net"), which serves the same paths.
// Their posters stay on the site.
export const MEDIA_BASE = "";
const media = (file: string) => `${MEDIA_BASE}/${file}`;

// Each video comes in two files: AV1 at 1440p (WebM), for the browsers that play it, and
// H.264 at 1080p (MP4) for the others (Safari on Apple devices without an AV1 decoder).
const AV1 = 'video/webm; codecs="av01.0.12M.10"';
const AV1_OPUS = 'video/webm; codecs="av01.0.12M.10, opus"';
const H264 = "video/mp4";

// The teaser (null: a placeholder holds its place), and its first image, shown before it plays
// and its thumbnail for search engines.
export const TEASER: { webm: string; mp4: string } | null = { webm: "veshell-teaser.webm", mp4: "veshell-teaser.mp4" };
export const TEASER_POSTER = "/veshell-teaser-poster.jpg";

// A place for a clip or a screenshot still to record: its frame, and what will go there.
const Media: React.FC<{ caption: string; ratio?: string }> = ({ caption, ratio = "16 / 9" }) => (
  <figure className="media-placeholder" style={{ aspectRatio: ratio }}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5v5l4-2.5z" />
    </svg>
    <figcaption>{caption}</figcaption>
  </figure>
);

// A silent screen recording from Veshell (a file in public/, with its first frame as a .jpg
// poster): its poster and a play button until clicked, then it loops; a click pauses it, and so
// does scrolling it off screen. Loaded when the pointer comes over it (or on the click); the
// button spins while it loads, and the poster goes once the video's own frames are showing.
type ClipState = "idle" | "loading" | "playing";
const Clip: React.FC<{ name: string; label: string }> = ({ name, label }) => {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [state, setState] = React.useState<ClipState>("idle");
  const [started, setStarted] = React.useState(false);
  // Prerendered (no script to drive the button): the browser's own controls.
  const scripted = typeof window !== "undefined";
  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause();
    });
    io.observe(video);
    return () => io.disconnect();
  }, []);
  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      video.play().catch(() => setState("idle"));
    } else video.pause();
  };
  const preload = () => {
    if (ref.current && ref.current.preload === "none") ref.current.preload = "auto";
  };
  return (
    <div className={`clip clip-${state}`} onPointerEnter={preload}>
      <video
        ref={ref}
        poster={started ? undefined : `/${name}.jpg`}
        width={2560}
        height={1440}
        muted
        loop
        playsInline
        preload="none"
        controls={!scripted}
        aria-label={label}
        onClick={toggle}
        onPlay={() => setState("loading")}
        onWaiting={() => setState("loading")}
        onPlaying={() => {
          setStarted(true);
          setState("playing");
        }}
        onPause={() => setState("idle")}
      >
        <source src={media(`${name}.webm`)} type={AV1} />
        <source src={media(`${name}.mp4`)} type={H264} />
      </video>
      {scripted && (
        <button
          type="button"
          className="clip-button"
          onClick={toggle}
          onFocus={preload}
          aria-label={`${state === "idle" ? "Play" : "Pause"}: ${label}`}
          aria-busy={state === "loading"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {state === "idle" ? <path d="M8 5.5v13l11-6.5z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
          </svg>
        </button>
      )}
    </div>
  );
};

const Block: React.FC<{ id: string; title?: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={`section-${id}`} data-section={id} className="block">
    {title && <h2>{title}</h2>}
    {children}
  </section>
);

// Commands only where they're known for sure; the other distros point to the instructions.
const INSTALL: { distro: string; command?: string; packages?: string }[] = [
  { distro: "Arch / Manjaro (AUR)", command: "yay -S veshell-bin", packages: "veshell, veshell-bin or veshell-git" },
  { distro: "NixOS (flake)", command: "nix run github:free-explorers/veshell" },
  { distro: "Fedora (COPR)" },
  { distro: "openSUSE Tumbleweed, Slowroll, Leap 16 (OBS)" },
  { distro: "Debian 13 · Ubuntu 26.04 (OBS)" },
];
const REPO = "https://github.com/free-explorers/veshell";
const INSTRUCTIONS = `${REPO}#installation`;

// The Explorers' introduction, on the home page's card.
export const HomeIntro: React.FC = () => (
  <p>
    The Free Explorers are an <a href={COLLECTIVE}>Open Collective</a> funding and building open-source projects. Every boat on this sea is an Explorer
    backing the people who build them: the Architects.
  </p>
);

export const VeshellContent: React.FC = () => (
  <>
    <Block id="teaser">
      {TEASER ? (
        <video className="teaser" poster={TEASER_POSTER} controls playsInline preload="metadata" aria-label="Veshell teaser">
          <source src={media(TEASER.webm)} type={AV1_OPUS} />
          <source src={media(TEASER.mp4)} type={H264} />
        </video>
      ) : (
        <div className="teaser teaser-placeholder">
          <span className="teaser-play" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <span className="teaser-label">Teaser coming soon</span>
        </div>
      )}
      <p className="lead">
        Veshell is a not-desktop environment for Linux. Instead of piling windows up like papers on a desk, it lays your apps out on a map you learn by heart,
        the way you know where everything is in your own kitchen.
      </p>
      <div className="actions">
        <a className="cta" href="#section-install">
          Install Veshell
        </a>
        <a className="cta cta-ghost" href={`${COLLECTIVE}/projects/veshell`} target="_blank" rel="noreferrer">
          Fund Veshell
        </a>
        <a className="cta cta-ghost" href={REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </Block>

    <Block id="why" title="Why Veshell">
      <p>
        The desktop metaphor dates back to 1970: the screen as a desk, windows piled up like papers. It made sense to bring office workers to computers. Today we
        do everything on them, work, friends, films, games, and finding a window has become like searching for a document in a pile of papers.
      </p>
      <p>
        We already know how to find our way: we remember where things are in a space, and we build a mental map of it. Veshell is made for that sense of
        direction. Everything is <strong>predictable</strong>, <strong>spatial</strong> and <strong>navigable</strong>.
      </p>
      <p>
        Hence the name: <strong>Veshell</strong> is the contraction of <em>vessel</em> and <em>shell</em>. The shell you use your computer through, and the
        vessel that carries you across your digital world.
      </p>
    </Block>

    <Block id="map" title="A map, not a desk">
      <div className="split">
        <p>
          Everything lives on a 2D grid: <strong>rows are workspaces</strong>, <strong>columns are windows</strong>. A new app goes at the end of its row, a new
          workspace at the bottom. There's always an empty workspace waiting below, and empty ones clean themselves up. Group your apps by project, by theme, by
          whatever makes sense to you.
        </p>
        <Clip name="J1-Build" label="Building a layout in Veshell: apps opening, workspaces appearing" />
      </div>
    </Block>

    <Block id="move" title="Move by direction">
      <div className="split">
        <p>
          <kbd>Super</kbd> + <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> moves you around the map, one hand on the keyboard, with sliding transitions
          so you always feel where you're going. Add <kbd>Shift</kbd> to carry a window along: reorder it, or send it to the workspace above or below and follow
          it. The same four directions work everywhere, and the panels show the map at a glance for the mouse and touch.
        </p>
        <Clip name="J2-NavMap" label="Moving around the Veshell map with W A S D" />
      </div>
    </Block>

    <Block id="remember" title="It remembers everything">
      <div className="split">
        <p>
          Every layout decision is kept, even across reboots. A closed app leaves a placeholder in its place; click it and Veshell resumes your work: the same
          documents, and for a terminal the same folder and the same program running.
        </p>
        <Clip name="J3-Persist" label="Veshell after a reboot: every app back where it was" />
      </div>
    </Block>

    <Block id="overview" title="Quick errands in the Overview">
      <div className="split">
        <p>
          For a quick calculation, a setting or a file, open the Overview: search apps, files or settings, and what you open there stays there, as an ephemeral
          tab that never disturbs your layout. Browse and preview files in place. Its dashboard, the Helm, gathers your media, audio and Bluetooth devices,
          network, notifications and live system monitoring.
        </p>
        <Clip name="J4-Helm" label="The Overview and the Helm in Veshell" />
      </div>
    </Block>

    <Block id="play" title="Play">
      <div className="split">
        <p>
          In game mode, a game runs full size with direct input, with nothing of the shell in the way. Pause it and it waits, frosted, in its tile; come back to
          it with a click, leave it with <kbd>Ctrl</kbd> + <kbd>Esc</kbd>.
        </p>
        <Media caption="Game mode" />
      </div>
    </Block>

    <Block id="environment" title="A whole environment">
      <ul className="features">
        <li>
          <strong>Multiple monitors</strong>
          <span>Each screen has its own workspaces; ultra-wide screens split into several.</span>
        </li>
        <li>
          <strong>Floating mode</strong>
          <span>For the apps that need free placement, kept inside their tile.</span>
        </li>
        <li>
          <strong>Lock screen</strong>
          <span>Password or fingerprint, locked before sleep.</span>
        </li>
        <li>
          <strong>Notifications</strong>
          <span>Routed to where the app lives in your map.</span>
        </li>
        <li>
          <strong>Settings</strong>
          <span>Keyboard, mouse, displays, theme colour and icons, searchable from the Overview.</span>
        </li>
        <li>
          <strong>Screenshots and sharing</strong>
          <span>Screenshot, screencast and file chooser portals.</span>
        </li>
        <li>
          <strong>20+ languages</strong>
          <span>From Arabic to Vietnamese.</span>
        </li>
        <li>
          <strong>Private</strong>
          <span>No analytics, no phone-home.</span>
        </li>
      </ul>
    </Block>

    <Block id="install" title="Install it">
      <dl className="install">
        {INSTALL.map((i) => (
          <React.Fragment key={i.distro}>
            <dt>{i.distro}</dt>
            <dd>
              {i.command ? (
                <>
                  <code>{i.command}</code>
                  {i.packages && <span className="note"> · packages: {i.packages}</span>}
                </>
              ) : (
                <a href={INSTRUCTIONS} target="_blank" rel="noreferrer">
                  Installation instructions
                </a>
              )}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </Block>

    <Block id="open" title="Built in the open">
      <p>
        Veshell is written in Rust and Flutter, released under the GPL-3.0, and funded by the Free Explorers. It's the successor to Material Shell. Source,
        issues and documentation are on{" "}
        <a href={REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
        ; support its development on{" "}
        <a href={`${COLLECTIVE}/projects/veshell`} target="_blank" rel="noreferrer">
          Open Collective
        </a>
        .
      </p>
    </Block>
  </>
);

export const ArchitectsContent: React.FC = () => (
  <>
    <Block id="intro">
      <p className="lead">
        Architects dedicate their time to building the technologies of tomorrow. The collective funds them, so projects are delivered with care and stay alive
        for the long run.
      </p>
    </Block>

    <Block id="how" title="How it works">
      <p>
        Every Explorer's contribution goes through our <a href={COLLECTIVE}>Open Collective</a>, where every income and expense is public. The collective pays
        the Architects to work on its projects. In return, Explorers take part in decisions and get support across the projects.
      </p>
    </Block>

    <Block id="who" title="The Architects">
      <div className="architect">
        <img src="https://github.com/PapyElGringo.png?size=160" alt="" width={72} height={72} />
        <div>
          <h3>
            <a href="https://github.com/PapyElGringo" target="_blank" rel="noreferrer">
              PapyElGringo
            </a>
          </h3>
          <p>
            Adrien Peslerbe, front-end developer and UX architect. He created Material Shell, used by hundreds of thousands of people on GNOME, and now leads
            Veshell to change how we interact with our digital environment.
          </p>
        </div>
      </div>
    </Block>

    <Block id="join" title="Become one">
      <p>
        Building something the collective could get behind? Come and talk to us on{" "}
        <a href="https://discord.gg/vBb7D9a" target="_blank" rel="noreferrer">
          Discord
        </a>
        .
      </p>
    </Block>
  </>
);
