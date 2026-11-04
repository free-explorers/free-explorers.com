import React from "react";
import type { BoatKind } from "../members";

// Five design proposals for the explorers' boats, each a family covering the four boats
// (dinghy, sloop, brigantine, galleon) so a row reads as one fleet. Every boat is drawn with
// its waterline at y 0, centred on x 0, bow to the right, at the same scale as the site's.

export type Proposal = { id: string; name: string; blurb: string; Boat: React.FC<BoatProps> };
export type BoatProps = { kind: BoatKind; image?: string; name: string; uid: string };

// ---------------------------------------------------------------------------------------
// Shared rig geometry: hull length L, freeboard F (deck at y -F), and each boat's masts.

type Rig = { L: number; F: number };
const RIG: Record<BoatKind, Rig> = {
  dinghy: { L: 130, F: 20 },
  sloop: { L: 210, F: 30 },
  brig: { L: 300, F: 40 },
  galleon: { L: 440, F: 60 },
};
const TIER_COLOR: Record<BoatKind, string> = { dinghy: "#a6e3a1", sloop: "#89dceb", brig: "#cba6f7", galleon: "#f9c46b" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// The member's avatar clipped to a circle, over a disc (initials show until it loads).
const Avatar: React.FC<{ cx: number; cy: number; r: number; image?: string; name: string; uid: string; ring?: string; disc?: string; ringWidth?: number }> = ({
  cx,
  cy,
  r,
  image,
  name,
  uid,
  ring,
  disc = "#123a4a",
  ringWidth = 3,
}) => (
  <g>
    <defs>
      <clipPath id={`lab-av-${uid}`}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
    </defs>
    {ring && <circle cx={cx} cy={cy} r={r + ringWidth} fill={ring} />}
    <circle cx={cx} cy={cy} r={r} fill={disc} />
    <text x={cx} y={cy} dy="0.36em" textAnchor="middle" fontSize={r * 0.9} fontWeight={700} fill="#fff" fontFamily="Outfit, sans-serif">
      {initials(name)}
    </text>
    {image && <image href={image} x={cx - r} y={cy - r} width={r * 2} height={r * 2} clipPath={`url(#lab-av-${uid})`} preserveAspectRatio="xMidYMid slice" />}
  </g>
);

// Sails. `mx` is the mast, `top`/`foot` the sail's head and foot heights, `w` how far it
// reaches back (towards the stern) or `hw` its half-width for square sails.
const triangle = (mx: number, top: number, foot: number, w: number) =>
  `M ${mx} ${top} L ${mx} ${foot} L ${mx - w} ${foot} Q ${mx - w * 0.36} ${(top + foot) / 2 + 6} ${mx} ${top} Z`;
const triangleShade = (mx: number, top: number, foot: number, w: number) =>
  `M ${mx} ${top} L ${mx - w * 0.5} ${foot} L ${mx - w} ${foot} Q ${mx - w * 0.36} ${(top + foot) / 2 + 6} ${mx} ${top} Z`;
const gaff = (mx: number, top: number, foot: number, w: number) =>
  `M ${mx} ${top + 26} L ${mx - w * 0.82} ${top} L ${mx - w} ${foot} L ${mx} ${foot} Z`;
const square = (x: number, top: number, bottom: number, hw: number) =>
  `M ${x - hw} ${top} L ${x + hw} ${top} Q ${x + hw * 1.1} ${(top + bottom) / 2} ${x + hw * 0.94} ${bottom} Q ${x} ${bottom + 12} ${x - hw * 0.94} ${bottom} Q ${x - hw * 1.1} ${(top + bottom) / 2} ${x - hw} ${top} Z`;
const jib = (mx: number, top: number, bowX: number, bowY: number, foot: number) => `M ${mx + 4} ${top} L ${bowX} ${bowY} L ${mx + 6} ${foot} Z`;
// The circle that fits a triangular sail (vertical luff, horizontal foot).
const inTriangle = (mx: number, top: number, foot: number, w: number) => {
  const a = foot - top;
  const r = (a + w - Math.hypot(a, w)) / 2;
  return { cx: mx - r * 0.98, cy: foot - r * 1.02, r: r * 0.8 };
};

// The masts and sails of each boat, shared by the families that use classic rigs.
type Plan = {
  deck: number;
  bow: { x: number; y: number };
  // Fore-and-aft sails: mast x, height above deck, reach back.
  fa: { x: number; h: number; w: number; base?: number }[];
  // Square-rigged masts: mast x, height, and the sails' half-widths and spans.
  sq: { x: number; h: number; sails: { hw: number; top: number; bottom: number }[] }[];
  jib: boolean;
  castle?: { x0: number; x1: number; h: number };
};
const plan = (kind: BoatKind): Plan => {
  const { L, F } = RIG[kind];
  const deck = -F;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  switch (kind) {
    case "dinghy":
      return { deck, bow, fa: [{ x: 8, h: 130, w: 60 }], sq: [], jib: false };
    case "sloop":
      return { deck, bow, fa: [{ x: 0, h: 210, w: 88 }], sq: [], jib: true };
    case "brig":
      return {
        deck,
        bow,
        fa: [{ x: -62, h: 262, w: 110 }],
        sq: [
          {
            x: 72,
            h: 240,
            sails: [
              { hw: 46, top: deck - 228, bottom: deck - 140 },
              { hw: 56, top: deck - 128, bottom: deck - 30 },
            ],
          },
        ],
        jib: true,
      };
    case "galleon":
      return {
        deck,
        bow: { x: L / 2 + 20, y: deck - 24 },
        castle: { x0: -L / 2 - 14, x1: -L / 2 + 120, h: 52 },
        fa: [{ x: -170, h: 200, w: 86, base: deck - 52 }],
        sq: [
          {
            x: -10,
            h: 330,
            sails: [
              { hw: 68, top: deck - 290, bottom: deck - 172 },
              { hw: 84, top: deck - 160, bottom: deck - 38 },
            ],
          },
          {
            x: 140,
            h: 280,
            sails: [
              { hw: 56, top: deck - 246, bottom: deck - 150 },
              { hw: 68, top: deck - 138, bottom: deck - 38 },
            ],
          },
        ],
        jib: true,
      };
  }
};

// Where the avatar goes on the main sail: the aft fore-and-aft sail, or the galleon's main
// course.
const sailSpot = (kind: BoatKind, p: Plan) => {
  if (kind === "galleon") {
    const s = p.sq[0].sails[1];
    return { cx: p.sq[0].x, cy: (s.top + s.bottom) / 2, r: 34 };
  }
  const m = p.fa[0];
  const base = m.base ?? p.deck;
  return inTriangle(m.x - 3, base - m.h + 8, base - 12, m.w);
};

// Hull outlines.
const classicHull = (kind: BoatKind) => {
  const { L, F } = RIG[kind];
  const D = L * 0.1;
  return `M ${-L / 2} ${-F} L ${L / 2 + L * 0.05} ${-F * 1.3} Q ${L * 0.42} ${D} ${L * 0.28} ${D} L ${-L * 0.36} ${D} Q ${-L * 0.5} ${D * 0.6} ${-L / 2} ${-F} Z`;
};
const galleonHull = (p: Plan, L: number) => {
  const D = -p.deck;
  const c = p.castle!;
  const top = p.deck - c.h;
  return `M ${c.x0} ${top} L ${c.x1} ${top} L ${c.x1} ${p.deck} L ${L / 2 - 20} ${p.deck} L ${L / 2 + 26} ${p.deck - 22} Q ${L / 2 - 15} ${D * 0.7} ${L / 2 - 70} ${D * 0.72} L ${-L / 2 + 60} ${D * 0.72} Q ${c.x0 + 6} ${D * 0.5} ${c.x0} ${top} Z`;
};
const hullFor = (kind: BoatKind, p: Plan) => (kind === "galleon" ? galleonHull(p, RIG.galleon.L) : classicHull(kind));

// Masts, booms and stays drawn the same way for the classic rigs.
const Spars: React.FC<{ p: Plan; L: number; color: string; rope: string; pennant?: string }> = ({ p, L, color, rope, pennant }) => (
  <g>
    {[...p.fa.map((m) => ({ x: m.x, h: m.h, base: m.base ?? p.deck })), ...p.sq.map((m) => ({ x: m.x, h: m.h, base: p.deck }))].map((m, i) => (
      <g key={i}>
        <rect x={m.x - 2.5 - L / 200} y={m.base - m.h} width={5 + L / 100} height={m.h} rx={2} fill={color} />
        {pennant && <path d={`M ${m.x + 2} ${m.base - m.h} L ${m.x + 2 + Math.max(22, L * 0.12)} ${m.base - m.h + 6} L ${m.x + 2} ${m.base - m.h + 13} Z`} fill={pennant} />}
      </g>
    ))}
    {p.jib && (() => {
      const fore = [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0];
      const base = ("base" in fore && fore.base) || p.deck;
      return <line x1={fore.x} y1={base - fore.h} x2={p.bow.x} y2={p.bow.y} stroke={rope} strokeWidth={1.4} opacity={0.75} />;
    })()}
    {p.fa.map((m, i) => (
      <line key={i} x1={m.x} y1={(m.base ?? p.deck) - m.h} x2={-L / 2 + 4} y2={m.base ?? p.deck} stroke={rope} strokeWidth={1.2} opacity={0.6} />
    ))}
  </g>
);

// A planked hull: fill, plank lines, the shaded bottom and a gunwale.
const PlankHull: React.FC<{ d: string; uid: string; L: number; F: number; wood: string; line: string; dark: string; trim?: string }> = ({ d, uid, L, F, wood, line, dark, trim }) => (
  <g>
    <defs>
      <clipPath id={`lab-hull-${uid}`}>
        <path d={d} />
      </clipPath>
    </defs>
    <path d={d} fill={wood} />
    <g clipPath={`url(#lab-hull-${uid})`}>
      {[0.25, 0.5, 0.75].map((f) => (
        <rect key={f} x={-L} y={-F * 1.4 + (F * 1.4 + L * 0.1) * f} width={L * 2} height={Math.max(1.6, L * 0.01)} fill={line} />
      ))}
      {trim && <rect x={-L} y={-F + F * 0.18} width={L * 2} height={Math.max(3, F * 0.12)} fill={trim} />}
      <rect x={-L} y={-1} width={L * 2} height={L * 0.3} fill={dark} opacity={0.55} />
    </g>
  </g>
);

// ---------------------------------------------------------------------------------------
// 1. Teaser: the Veshell house-boat's look. Plank hull, two-tone sails split on the diagonal,
// the avatar on a flag at the masthead (cream, teal disc), like the Veshell flag.

const TeaserBoat: React.FC<BoatProps> = ({ kind, image, name, uid }) => {
  const { L, F } = RIG[kind];
  const p = plan(kind);
  const SAIL = "#f4f1ea";
  const SHADE = "#dcd5c4";
  const tallest = [...p.fa.map((m) => ({ x: m.x, top: (m.base ?? p.deck) - m.h })), ...p.sq.map((m) => ({ x: m.x, top: p.deck - m.h }))].sort((a, b) => a.top - b.top)[0];
  const fw = Math.max(46, L * 0.2);
  const fh = fw * 0.66;
  return (
    <g>
      <Spars p={p} L={L} color="#5a3522" rope="#3b2b20" />
      {p.fa.map((m, i) => {
        const base = m.base ?? p.deck;
        return (
          <g key={i}>
            <path d={triangle(m.x - 3, base - m.h + 8, base - 12, m.w)} fill={SAIL} />
            <path d={triangleShade(m.x - 3, base - m.h + 8, base - 12, m.w)} fill={SHADE} />
          </g>
        );
      })}
      {p.sq.map((m) =>
        m.sails.map((s, j) => (
          <g key={`${m.x}-${j}`}>
            <path d={square(m.x, s.top, s.bottom, s.hw)} fill={SAIL} />
            <path d={`M ${m.x} ${s.top} L ${m.x + s.hw} ${s.top} Q ${m.x + s.hw * 1.1} ${(s.top + s.bottom) / 2} ${m.x + s.hw * 0.94} ${s.bottom} Q ${m.x + s.hw * 0.5} ${s.bottom + 8} ${m.x} ${s.bottom + 10} Z`} fill={SHADE} />
            <rect x={m.x - s.hw - 6} y={s.top - 3} width={s.hw * 2 + 12} height={5} rx={2.5} fill="#5a3522" />
          </g>
        )),
      )}
      {p.jib && <path d={jib([...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].x, p.deck - [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].h + 26, p.bow.x - 8, p.bow.y - 4, p.deck - 14)} fill={SHADE} />}
      <PlankHull d={hullFor(kind, p)} uid={`t-${uid}`} L={L} F={F} wood="#a9744f" line="#8a5b3b" dark="#5a3522" />
      {kind === "galleon" &&
        [0, 1, 2].map((k) => <rect key={k} x={p.castle!.x0 + 18 + k * 34} y={p.deck - p.castle!.h + 14} width={20} height={22} rx={6} fill="#ffd66b" />)}
      {/* The masthead flag with the avatar */}
      <g>
        <path d={`M ${tallest.x + 3} ${tallest.top + 2} Q ${tallest.x + fw * 0.5} ${tallest.top - 6} ${tallest.x + fw} ${tallest.top + 4} L ${tallest.x + fw} ${tallest.top + fh} Q ${tallest.x + fw * 0.5} ${tallest.top + fh - 8} ${tallest.x + 3} ${tallest.top + fh} Z`} fill="#f4f1ea" />
        <Avatar cx={tallest.x + 3 + fw / 2} cy={tallest.top + fh / 2 + 1} r={fh * 0.34} ring="#006888" ringWidth={fh * 0.06} image={image} name={name} uid={`t-${uid}`} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// 2. Explorer: rigs with a story. A rowboat with oars and a little lug sail, a gaff cutter,
// a brigantine (square fore, gaff main), a galleon. Varnished wood with a gold trim, canvas
// sails with seams, the avatar on a round shield on the hull.

const ExplorerBoat: React.FC<BoatProps> = ({ kind, image, name, uid }) => {
  const { L, F } = RIG[kind];
  const p = plan(kind);
  const CANVAS = "#ecdcb8";
  const CANVAS_SHADE = "#d8c49a";
  const SEAM = "#c7b083";
  const seams = (mx: number, top: number, foot: number, w: number, id: string) => (
    <g clipPath={`url(#${id})`}>
      {Array.from({ length: 6 }, (_, k) => (
        <line key={k} x1={mx - (w * (k + 1)) / 7} y1={top - 40} x2={mx - (w * (k + 1)) / 7} y2={foot} stroke={SEAM} strokeWidth={1.4} />
      ))}
    </g>
  );
  const shieldR = kind === "galleon" ? 26 : Math.max(14, F * 0.5);
  const shield = { cx: kind === "galleon" ? 40 : L * 0.04, cy: kind === "galleon" ? p.deck + 30 : -F * 0.42 };
  return (
    <g>
      {kind === "dinghy" ? (
        // The rowboat: a short mast with a lug sail, and oars in the water.
        <g>
          <rect x={6} y={p.deck - 110} width={4} height={110} fill="#4a2c1a" />
          <defs>
            <clipPath id={`lab-e-lug-${uid}`}>
              <path d={`M ${-30} ${p.deck - 104} L ${30} ${p.deck - 112} L ${36} ${p.deck - 16} L ${-34} ${p.deck - 16} Z`} />
            </clipPath>
          </defs>
          <path d={`M ${-30} ${p.deck - 104} L ${30} ${p.deck - 112} L ${36} ${p.deck - 16} L ${-34} ${p.deck - 16} Z`} fill={CANVAS} />
          {seams(36, p.deck - 112, p.deck - 16, 70, `lab-e-lug-${uid}`)}
          <line x1={-34} y1={p.deck - 103} x2={34} y2={p.deck - 113} stroke="#4a2c1a" strokeWidth={3} strokeLinecap="round" />
          <line x1={-30} y1={p.deck + 2} x2={-82} y2={2} stroke="#7a4b2e" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={-86} cy={3} rx={11} ry={4} fill="#7a4b2e" transform="rotate(12 -86 3)" />
          <line x1={30} y1={p.deck + 2} x2={82} y2={2} stroke="#7a4b2e" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={86} cy={3} rx={11} ry={4} fill="#7a4b2e" transform="rotate(-12 86 3)" />
        </g>
      ) : (
        <g>
          <Spars p={p} L={L} color="#4a2c1a" rope="#3b2b20" pennant="#b5432f" />
          {p.fa.map((m, i) => {
            const base = m.base ?? p.deck;
            const top = base - m.h + 10;
            const foot = base - 12;
            const id = `lab-e-fa-${uid}-${i}`;
            const d = kind === "galleon" ? triangle(m.x - 3, top, foot, m.w) : gaff(m.x - 3, top, foot, m.w);
            return (
              <g key={i}>
                <defs>
                  <clipPath id={id}>
                    <path d={d} />
                  </clipPath>
                </defs>
                <path d={d} fill={CANVAS} />
                {seams(m.x - 3, top, foot, m.w, id)}
                {kind !== "galleon" && <line x1={m.x - 3} y1={top + 26} x2={m.x - 3 - m.w * 0.85} y2={top - 2} stroke="#4a2c1a" strokeWidth={3.5} strokeLinecap="round" />}
                <rect x={m.x - 3 - m.w - 3} y={foot} width={m.w + 3} height={3.5} rx={1.5} fill="#4a2c1a" />
              </g>
            );
          })}
          {p.sq.map((m) =>
            m.sails.map((s, j) => (
              <g key={`${m.x}-${j}`}>
                <path d={square(m.x, s.top, s.bottom, s.hw)} fill={j === 0 ? CANVAS_SHADE : CANVAS} />
                {[-0.5, 0, 0.5].map((f) => (
                  <line key={f} x1={m.x + s.hw * f} y1={s.top} x2={m.x + s.hw * f * 0.95} y2={s.bottom + 4} stroke={SEAM} strokeWidth={1.4} />
                ))}
                <rect x={m.x - s.hw - 6} y={s.top - 3} width={s.hw * 2 + 12} height={5} rx={2.5} fill="#4a2c1a" />
              </g>
            )),
          )}
          {p.jib && <path d={jib([...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].x, p.deck - [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].h + 26, p.bow.x - 8, p.bow.y - 4, p.deck - 14)} fill={CANVAS_SHADE} />}
        </g>
      )}
      <PlankHull d={hullFor(kind, p)} uid={`e-${uid}`} L={L} F={F} wood="#7a4b2e" line="#5f3820" dark="#3a2214" trim="#d9a441" />
      {kind === "galleon" &&
        [0, 1, 2].map((k) => <rect key={k} x={p.castle!.x0 + 18 + k * 34} y={p.deck - p.castle!.h + 14} width={20} height={22} rx={10} fill="#ffd66b" stroke="#d9a441" strokeWidth={3} />)}
      {/* The shield on the hull */}
      <circle cx={shield.cx} cy={shield.cy} r={shieldR + 4} fill="#d9a441" />
      <Avatar cx={shield.cx} cy={shield.cy} r={shieldR} image={image} name={name} uid={`e-${uid}`} disc="#5f3820" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// 3. Toy: chunky and friendly. Round hulls painted in the boat's colour with a white band,
// thick rounded white sails, the avatar in a big porthole.

const toyHull = (kind: BoatKind, p: Plan) => {
  const { L, F } = RIG[kind];
  const D = L * 0.13;
  if (kind === "galleon") {
    const c = p.castle!;
    return `M ${c.x0 + 10} ${p.deck - c.h} Q ${c.x0} ${p.deck - c.h} ${c.x0} ${p.deck - c.h + 12} Q ${c.x0 - 6} ${D} ${-L / 2 + 70} ${D} L ${L / 2 - 60} ${D} Q ${L / 2 + 20} ${D * 0.6} ${L / 2 + 26} ${p.deck - 18} Q ${L / 2 + 26} ${p.deck - 26} ${L / 2 + 14} ${p.deck - 22} L ${c.x1} ${p.deck} L ${c.x1} ${p.deck - c.h + 8} Q ${c.x1} ${p.deck - c.h} ${c.x1 - 10} ${p.deck - c.h} Z`;
  }
  const T = F * 1.8;
  return `M ${-L / 2 + 10} ${-T} Q ${-L / 2 - 6} ${-T} ${-L / 2 - 4} ${-T + 12} Q ${-L / 2 + 4} ${D} ${-L * 0.25} ${D} L ${L * 0.25} ${D} Q ${L / 2 + 6} ${D * 0.8} ${L / 2 + 10} ${-T * 1.1} Q ${L / 2 + 10} ${-T * 1.3} ${L / 2 - 8} ${-T * 1.24} Z`;
};

const ToyBoat: React.FC<BoatProps> = ({ kind, image, name, uid }) => {
  const { L, F } = RIG[kind];
  const p = plan(kind);
  const color = TIER_COLOR[kind];
  const sw = Math.max(5, L * 0.02);
  const d = toyHull(kind, p);
  const port = { cx: kind === "galleon" ? 30 : L * 0.08, cy: kind === "galleon" ? p.deck + 26 : -F * 0.95, r: kind === "galleon" ? 30 : Math.max(15, F * 0.6) };
  return (
    <g strokeLinejoin="round">
      {[...p.fa.map((m) => ({ x: m.x, h: m.h, base: m.base ?? p.deck })), ...p.sq.map((m) => ({ x: m.x, h: m.h, base: p.deck }))].map((m, i) => (
        <g key={i}>
          <rect x={m.x - sw / 2 - 1} y={m.base - m.h} width={sw + 2} height={m.h} rx={sw} fill="#6b4a3a" />
          <circle cx={m.x} cy={m.base - m.h - 4} r={sw * 1.2} fill={color} />
        </g>
      ))}
      {p.fa.map((m, i) => {
        const base = m.base ?? p.deck;
        return <path key={i} d={triangle(m.x - 6, base - m.h + 18, base - 16, m.w - 8)} fill="#ffffff" stroke="#ffffff" strokeWidth={sw * 1.6} />;
      })}
      {p.sq.map((m) =>
        m.sails.map((s, j) => <rect key={`${m.x}-${j}`} x={m.x - s.hw + 4} y={s.top + 4} width={s.hw * 2 - 8} height={s.bottom - s.top - 8} rx={14} fill="#ffffff" stroke="#e8eef2" strokeWidth={3} />),
      )}
      {p.jib && (() => {
        const fore = [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0];
        return <path d={jib(fore.x + 4, p.deck - fore.h + 34, p.bow.x - 18, p.bow.y - 10, p.deck - 18)} fill="#eef3f5" stroke="#eef3f5" strokeWidth={sw * 1.4} />;
      })()}
      <defs>
        <clipPath id={`lab-toy-${uid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={color} />
      <g clipPath={`url(#lab-toy-${uid})`}>
        <rect x={-L} y={kind === "galleon" ? p.deck + 4 : -F * 1.75} width={L * 2} height={Math.max(6, F * 0.22)} fill="#ffffff" opacity={0.9} />
        <rect x={-L} y={4} width={L * 2} height={L * 0.3} fill="#000" opacity={0.18} />
      </g>
      {kind === "galleon" && [0, 1, 2, 3, 4].map((k) => <circle key={k} cx={90 + k * 26} cy={p.deck + 22} r={7} fill="#ffffff" opacity={0.9} />)}
      <circle cx={port.cx} cy={port.cy} r={port.r + 5} fill="#ffffff" />
      <Avatar cx={port.cx} cy={port.cy} r={port.r} image={image} name={name} uid={`toy-${uid}`} disc="#2b6f87" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// 4. Origami: folded paper boats. Faceted hulls in two tones of the boat's pastel, sails as
// folded triangles (a light and a dark face), the avatar stamped on the main sail.

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
};

const OrigamiBoat: React.FC<BoatProps> = ({ kind, image, name, uid }) => {
  const { L, F } = RIG[kind];
  const p = plan(kind);
  const color = TIER_COLOR[kind];
  const PAPER = "#f6f2e8";
  const FOLD = "#ddd6c6";
  const D = L * 0.08;
  const H = F * 1.5;
  // The paper boat hull: two pointed ends rising above a flat bottom, a centre fold.
  const left = `M ${-L / 2 - L * 0.08} ${-H} L ${-L * 0.32} ${D} L 0 ${D} L 0 ${-F * 0.5} Z`;
  const right = `M ${L / 2 + L * 0.08} ${-H} L ${L * 0.32} ${D} L 0 ${D} L 0 ${-F * 0.5} Z`;
  const mid = `M ${-L * 0.22} ${-F * 0.5} L ${L * 0.22} ${-F * 0.5} L 0 ${D} Z`;
  const facetTriangle = (mx: number, top: number, foot: number, w: number, i: number) => (
    <g key={i}>
      <path d={`M ${mx} ${top} L ${mx} ${foot} L ${mx - w * 0.55} ${foot} Z`} fill={PAPER} />
      <path d={`M ${mx} ${top} L ${mx - w * 0.55} ${foot} L ${mx - w} ${foot} Z`} fill={FOLD} />
    </g>
  );
  const spot = sailSpot(kind, p);
  return (
    <g strokeLinejoin="round">
      {[...p.fa.map((m) => ({ x: m.x, h: m.h, base: m.base ?? p.deck })), ...p.sq.map((m) => ({ x: m.x, h: m.h, base: p.deck }))].map((m, i) => (
        <line key={i} x1={m.x} y1={m.base - m.h} x2={m.x} y2={m.base} stroke={shade(color, 0.55)} strokeWidth={3} />
      ))}
      {p.fa.map((m, i) => {
        const base = m.base ?? p.deck;
        return facetTriangle(m.x - 2, base - m.h + 6, base - 10, m.w, i);
      })}
      {p.sq.map((m) =>
        m.sails.map((s, j) => (
          <g key={`${m.x}-${j}`}>
            <path d={`M ${m.x - s.hw} ${s.top} L ${m.x} ${s.top - 8} L ${m.x} ${s.bottom} L ${m.x - s.hw} ${s.bottom - 8} Z`} fill={PAPER} />
            <path d={`M ${m.x} ${s.top - 8} L ${m.x + s.hw} ${s.top} L ${m.x + s.hw} ${s.bottom - 8} L ${m.x} ${s.bottom} Z`} fill={FOLD} />
          </g>
        )),
      )}
      {p.jib && (() => {
        const fore = [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0];
        return <path d={`M ${fore.x + 4} ${p.deck - fore.h + 26} L ${p.bow.x - 6} ${p.deck - 18} L ${fore.x + 6} ${p.deck - 18} Z`} fill={shade(color, 1.05)} />;
      })()}
      {kind === "galleon" ? (
        <g>
          <path d={`M ${-L / 2 - 30} ${-H - 40} L ${-L * 0.3} ${D} L ${L * 0.3} ${D} L ${L / 2 + 34} ${-H - 10} L ${L * 0.2} ${-F * 0.45} L ${-L * 0.25} ${-F * 0.45} Z`} fill={color} />
          <path d={`M ${-L / 2 - 30} ${-H - 40} L ${-L * 0.3} ${D} L ${-L * 0.05} ${D} L ${-L * 0.25} ${-F * 0.45} Z`} fill={shade(color, 0.82)} />
          <path d={`M ${L / 2 + 34} ${-H - 10} L ${L * 0.3} ${D} L ${L * 0.08} ${D} L ${L * 0.2} ${-F * 0.45} Z`} fill={shade(color, 0.7)} />
        </g>
      ) : (
        <g>
          <path d={left} fill={color} />
          <path d={right} fill={shade(color, 0.78)} />
          <path d={mid} fill={shade(color, 0.9)} />
        </g>
      )}
      <Avatar cx={spot.cx} cy={spot.cy} r={spot.r} ring={color} image={image} name={name} uid={`o-${uid}`} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// 5. Night lanterns: boats for the night sea. Dark hulls with warm lit windows and lanterns
// glowing at bow and stern, moonlit sails, the avatar in a gold ring on the main sail.

const NightBoat: React.FC<BoatProps> = ({ kind, image, name, uid }) => {
  const { L, F } = RIG[kind];
  const p = plan(kind);
  const MOON = "#e6ecef";
  const MOON_SHADE = "#c3ccd3";
  const HULL = "#2b3240";
  const spot = sailSpot(kind, p);
  const windows = kind === "dinghy" ? 0 : kind === "sloop" ? 2 : kind === "brig" ? 4 : 8;
  const lantern = (x: number, y: number, k: number) => (
    <g key={k}>
      <circle cx={x} cy={y} r={Math.max(14, L * 0.06)} fill="#ffd66b" opacity={0.18} />
      <circle cx={x} cy={y} r={Math.max(8, L * 0.035)} fill="#ffd66b" opacity={0.28} />
      <rect x={x - 3.5} y={y - 5} width={7} height={10} rx={2} fill="#ffe39a" stroke="#1d222c" strokeWidth={1.5} />
    </g>
  );
  return (
    <g>
      <Spars p={p} L={L} color="#1d222c" rope="#1d222c" pennant="#ffd66b" />
      {p.fa.map((m, i) => {
        const base = m.base ?? p.deck;
        return (
          <g key={i}>
            <path d={triangle(m.x - 3, base - m.h + 8, base - 12, m.w)} fill={MOON} />
            <path d={triangleShade(m.x - 3, base - m.h + 8, base - 12, m.w)} fill={MOON_SHADE} />
          </g>
        );
      })}
      {p.sq.map((m) =>
        m.sails.map((s, j) => (
          <g key={`${m.x}-${j}`}>
            <path d={square(m.x, s.top, s.bottom, s.hw)} fill={j === 0 ? MOON_SHADE : MOON} />
            <rect x={m.x - s.hw - 6} y={s.top - 3} width={s.hw * 2 + 12} height={5} rx={2.5} fill="#1d222c" />
          </g>
        )),
      )}
      {p.jib && <path d={jib([...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].x, p.deck - [...p.fa, ...p.sq].sort((a, b) => b.x - a.x)[0].h + 26, p.bow.x - 8, p.bow.y - 4, p.deck - 14)} fill={MOON_SHADE} />}
      <PlankHull d={hullFor(kind, p)} uid={`n-${uid}`} L={L} F={F} wood={HULL} line="#232a36" dark="#141820" trim="#3e4757" />
      {Array.from({ length: windows }, (_, k) => {
        const span = kind === "galleon" ? 300 : L * 0.5;
        const x0 = kind === "galleon" ? -100 : -span / 2;
        return <rect key={k} x={x0 + (k * span) / Math.max(1, windows - 1) - 5} y={kind === "galleon" ? p.deck + 18 : -F * 0.62} width={10} height={9} rx={3} fill="#ffd66b" />;
      })}
      {kind === "galleon" && [0, 1, 2].map((k) => <rect key={k} x={p.castle!.x0 + 18 + k * 34} y={p.deck - p.castle!.h + 14} width={20} height={22} rx={6} fill="#ffd66b" />)}
      {lantern(-L / 2 + 6, (kind === "galleon" ? p.deck - p.castle!.h : -F) - 12, 0)}
      {kind !== "dinghy" && lantern(p.bow.x - 6, p.bow.y - 12, 1)}
      <Avatar cx={spot.cx} cy={spot.cy} r={spot.r} ring="#e0b44f" image={image} name={name} uid={`n-${uid}`} />
    </g>
  );
};

export const PROPOSALS: Proposal[] = [
  { id: "teaser", name: "1 · Teaser", blurb: "Like the Veshell house-boat: plank hulls, two-tone sails, the avatar on a masthead flag like the Veshell flag.", Boat: TeaserBoat },
  { id: "explorer", name: "2 · Explorer", blurb: "Rigs with a story: a rowboat with oars, a gaff cutter, a brigantine, a galleon. Varnished wood, canvas sails, the avatar on a shield.", Boat: ExplorerBoat },
  { id: "toy", name: "3 · Toy", blurb: "Chunky and friendly: round hulls in the boat's colour, thick white sails, the avatar in a big porthole.", Boat: ToyBoat },
  { id: "origami", name: "4 · Origami", blurb: "Folded paper boats: faceted hulls in the boat's pastel, folded sails, the avatar stamped on the main sail.", Boat: OrigamiBoat },
  { id: "night", name: "5 · Night lanterns", blurb: "Made for the night sea: dark hulls with lit windows, glowing lanterns at bow and stern, moonlit sails.", Boat: NightBoat },
];
