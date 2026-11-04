import React, { useMemo } from "react";
import { Lighthouse, lighthouseFoot, lighthouseHeight, type LighthouseVariant } from "./Lighthouse";
import { OutpostBack, TowerDetails } from "./Outpost";
import { BOAT_SPEC } from "./Boat";
import { Fleet } from "./Fleet";
import type { Member } from "../members";
import boatMeta from "../data/veshell-boat.json";

// The world, in units where the frame is 1000 tall at its reference size (it gets taller on
// narrow screens, adding sky above). Pages sit side by side along the sea, each one frame
// wide; the camera slides from one to the next.
export const WATER = 690;
export const BOTTOM = 1000;

// The island: the teaser's lighthouse and church, drawn in the teaser's "house" units around
// the lighthouse's foot, scaled into the world.
const LH_VARIANT: LighthouseVariant = "K";
const LH_SCALE = (13 * lighthouseHeight("H")) / lighthouseHeight(LH_VARIANT);
const ISLAND_RISE = 700; // the lighthouse's foot above the sea, in house units
const LIGHTHOUSE_HEIGHT = 560; // in world units
const K = LIGHTHOUSE_HEIGHT / (lighthouseHeight(LH_VARIANT) * LH_SCALE);
// The quay's far end, right of the lighthouse (house units).
const QUAY_END = 2950;

export const islandX = (pageW: number) => Math.min(200, pageW * 0.2);
export const islandRight = (pageW: number) => islandX(pageW) + QUAY_END * K;

const Island: React.FC<{ x: number; time: number }> = ({ x, time }) => (
  <g transform={`translate(${x} ${WATER}) scale(${K}) translate(0 ${-ISLAND_RISE})`}>
    <OutpostBack x={0} foot={0} water={ISLAND_RISE} lit={1} />
    <g transform={`scale(${LH_SCALE}) translate(-116 ${-lighthouseFoot(LH_VARIANT)})`}>
      {/* A flat halo around the bulb: solid rings of pale light, no gradient */}
      {[78, 60].map((r) => (
        <circle key={r} cx={116} cy={103} r={r} fill="#fff3c4" opacity={0.1} />
      ))}
      <Lighthouse hole="#123a4a" beams={1} time={time} variant={LH_VARIANT} tower={{ stone: "#c9c2b5", line: "#a9a193", trim: "#1f2c36", door: "#6a432c", lit: 1 }} />
    </g>
    <TowerDetails x={0} foot={0} halfWidth={(h) => (66 - (h / LH_SCALE) * 0.07) * LH_SCALE} />
  </g>
);

// The sea: a band of water along every page, with a rolling surface and drifting light
// streaks. The waves roll with CSS (see .wave), so nothing re-renders per frame.
const WAVE_LEN = 120;
const swell = (y: number, amp: number, x0: number, x1: number, depth: number) => {
  let d = `M ${x0} ${y + depth} L ${x0} ${y}`;
  let up = true;
  for (let x = x0; x <= x1 + WAVE_LEN; x += WAVE_LEN / 2) {
    d += ` Q ${x + WAVE_LEN / 4} ${up ? y - amp : y + amp} ${x + WAVE_LEN / 2} ${y}`;
    up = !up;
  }
  return d + ` L ${x1 + WAVE_LEN} ${y + depth} Z`;
};

const SeaBack: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => (
  <g>
    <rect x={x0} y={WATER} width={x1 - x0} height={BOTTOM - WATER + 400} fill="url(#sea)" />
    <g className="wave wave-slow">
      <path d={swell(WATER, 3, x0 - WAVE_LEN, x1, 30)} fill="#0b6a8a" />
    </g>
  </g>
);

// Light streaks on the water, like the teaser's: thin pale dashes drifting at a few depths.
const Streaks: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => {
  const rows = useMemo(() => {
    const out: { x: number; y: number; w: number; o: number }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = WATER + 14; y < BOTTOM; y += 26) {
      const depth = (y - WATER) / (BOTTOM - WATER);
      for (let x = x0; x < x1; x += 260 + rnd() * 380) {
        out.push({ x: x + rnd() * 120, y: y + rnd() * 8, w: (30 + rnd() * 90) * (0.6 + depth), o: 0.12 + rnd() * 0.18 });
      }
    }
    return out;
  }, [x0, x1]);
  return (
    <g className="streaks">
      {rows.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={2.2} rx={1.1} fill="#cfe9f2" opacity={r.o} />
      ))}
    </g>
  );
};

const SeaFront: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => (
  <g className="wave wave-fast" opacity={0.85}>
    <path d={swell(BOTTOM - 22, 5, x0 - WAVE_LEN, x1, 400)} fill="#05384a" />
  </g>
);

// Where each member's boat goes: active explorers in three rows, the biggest boats in
// front; former explorers further out on the horizon, past the quay. Everything shrinks a
// little if the sea gets crowded.
export type Slot = { member: Member; x: number; y: number; scale: number; delay: number; shrink: number };
const ROWS = [
  { y: 945, scale: 0.92 },
  { y: 860, scale: 0.72 },
  { y: 790, scale: 0.56 },
];
const HORIZON = { y: 728, scale: 0.36 };
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};
export const layoutFleet = (members: Member[], pageW: number, reserveRight: number): Slot[] => {
  const left = 30;
  const right = pageW - 30 - reserveRight;
  const active = members.filter((m) => m.active);
  const former = members.filter((m) => !m.active);
  for (let shrink = 1; shrink > 0.2; shrink *= 0.85) {
    const slots: Slot[] = [];
    const queue = [...active];
    ROWS.forEach((row, r) => {
      const s = row.scale * shrink;
      const placed: Member[] = [];
      let width = 0;
      // Rows behind the front one keep clear of the island's rock on the left.
      const rowLeft = r === 0 ? left : left + 60 * r;
      const rowRight = right;
      while (queue.length) {
        const w = BOAT_SPEC[queue[0].tier].L * 1.35 * s;
        if (width + w > rowRight - rowLeft) break;
        width += w;
        placed.push(queue.shift()!);
      }
      // Spread the row's boats evenly over its width, centred on their gaps.
      const gap = (rowRight - rowLeft - width) / (placed.length + 1);
      let x = rowLeft + gap;
      placed.forEach((m, i) => {
        const w = BOAT_SPEC[m.tier].L * 1.35 * s;
        const j = (hash(m.id) - 0.5) * Math.min(gap, 80);
        slots.push({ member: m, x: x + w / 2 + j, y: row.y + (i % 2) * 10 * s, scale: s, delay: hash(m.id + "d") * 6, shrink });
        x += w + gap;
      });
    });
    let ok = queue.length === 0;
    // The horizon, past the quay.
    const hs = HORIZON.scale * shrink;
    const hLeft = islandRight(pageW) + 20;
    const hRight = right;
    const hw = former.reduce((a, m) => a + BOAT_SPEC[m.tier].L * 1.4 * hs, 0);
    if (hw > hRight - hLeft) ok = false;
    const hgap = (hRight - hLeft - hw) / (former.length + 1);
    let hx = hLeft + hgap;
    former.forEach((m) => {
      const w = BOAT_SPEC[m.tier].L * 1.4 * hs;
      slots.push({ member: m, x: hx + w / 2, y: HORIZON.y, scale: hs, delay: hash(m.id + "d") * 6, shrink });
      hx += w + hgap;
    });
    if (ok) return slots.sort((a, b) => a.y - b.y);
  }
  return [];
};

// The Veshell house-boat, exported from the teaser as a static drawing.
const VeshellBoat: React.FC<{ cx: number; maxWidth: number }> = ({ cx, maxWidth }) => {
  const VESHELL_HEIGHT = Math.min(600, (maxWidth * boatMeta.h) / boatMeta.w);
  const s = VESHELL_HEIGHT / boatMeta.h;
  const w = boatMeta.w * s;
  // The hull's middle (between stern and bow) sits at cx; the waterline on the sea.
  const mid = (boatMeta.stern + boatMeta.bow) / 2;
  const x = cx - (mid - boatMeta.x) * s;
  const y = WATER + 14 - (boatMeta.water - boatMeta.y) * s;
  return (
    <g className="bob bob-big">
      <image href={`${import.meta.env.BASE_URL}veshell-boat.svg`} x={x} y={y} width={w} height={VESHELL_HEIGHT} />
    </g>
  );
};

// The Architects' page: a wooden jetty with a lantern, where the architect's flag flies.
const Jetty: React.FC<{ x: number; architects: { name: string; image: string; url: string }[] }> = ({ x, architects }) => {
  const deck = WATER - 46;
  const len = 520;
  return (
    <g>
      {/* Piles */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={x + i * (len / 5) - 9} y={deck - 6} width={18} height={BOTTOM - deck} fill="#5a3522" />
      ))}
      {/* Deck planks */}
      <rect x={x - 30} y={deck} width={len + 60} height={22} rx={4} fill="#a9744f" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={x - 30 + i * ((len + 60) / 14)} y={deck} width={2} height={22} fill="#8a5b3b" />
      ))}
      {/* Lantern post at the end */}
      <rect x={x + len - 6} y={deck - 210} width={12} height={210} fill="#2f2e36" />
      <path d={`M ${x + len} ${deck - 200} q 40 -10 50 20`} stroke="#2f2e36" strokeWidth={6} fill="none" />
      <circle cx={x + len + 50} cy={deck - 158} r={40} fill="url(#bulb-glow)" />
      <rect x={x + len + 40} y={deck - 176} width={20} height={28} rx={4} fill="#ffd66b" stroke="#2f2e36" strokeWidth={3} />
      {/* A flagpole per architect, flying their avatar */}
      {architects.map((a, i) => {
        const fx = x + 120 + i * 180;
        const top = deck - 330;
        return (
          <a key={a.name} href={a.url} target="_blank" rel="noreferrer" className="boat" aria-label={a.name}>
            <rect x={fx - 4} y={top} width={8} height={deck - top} fill="#5a3522" />
            <circle cx={fx} cy={top - 4} r={7} fill="#f9c46b" />
            <g className="flag" style={{ transformOrigin: `${fx}px ${top + 10}px` }}>
              <path d={`M ${fx + 4} ${top + 8} L ${fx + 150} ${top + 14} L ${fx + 146} ${top + 112} L ${fx + 4} ${top + 106} Z`} fill="#f4f1ea" />
              <clipPath id={`arch-${i}`}>
                <circle cx={fx + 76} cy={top + 60} r={38} />
              </clipPath>
              <circle cx={fx + 76} cy={top + 60} r={42} fill="#006888" />
              <image href={a.image} x={fx + 38} y={top + 22} width={76} height={76} clipPath={`url(#arch-${i})`} />
            </g>
            <g className="boat-label" transform={`translate(${fx + 76} ${top - 26})`}>
              <text textAnchor="middle" className="boat-name">
                {a.name}
              </text>
            </g>
          </a>
        );
      })}
    </g>
  );
};

export const ARCHITECTS = [{ name: "PapyElGringo", image: "https://github.com/PapyElGringo.png?size=160", url: "https://github.com/PapyElGringo" }];

export const World: React.FC<{
  pageW: number;
  pages: number;
  members: Member[];
  beamTime: number;
  // The page in view (boats only turn about out of sight).
  page: number;
  // Width of the text column on the right, in world units (kept clear on each page).
  reserveRight: number;
}> = ({ pageW, pages, members, beamTime, reserveRight, page }) => {
  const x0 = -pageW;
  const x1 = pageW * (pages + 1);
  const fleet = useMemo(() => layoutFleet(members, pageW, reserveRight), [members, pageW, reserveRight]);
  const usable = pageW - reserveRight;
  return (
    <g>
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#0b5f7c" />
          <stop offset="0.45" stopColor="#063f53" />
          <stop offset="1" stopColor="#042c3a" />
        </linearGradient>
        <radialGradient id="bulb-glow">
          <stop offset="0" stopColor="#fff3c4" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff3c4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <SeaBack x0={x0} x1={x1} />
      <Streaks x0={x0} x1={x1} />
      {/* Page 1: the lighthouse and the fleet of explorers */}
      <Island x={islandX(pageW)} time={beamTime} />
      {/* Page 2: Veshell */}
      <VeshellBoat cx={pageW + Math.min(Math.max(usable * 0.5, 420), pageW / 2)} maxWidth={Math.min(usable, pageW) * 0.92} />
      {/* Page 3: the Architects' jetty */}
      <Jetty x={pageW * 2 + Math.max(60, usable * 0.5 - 300)} architects={ARCHITECTS} />
      {/* The explorers' boats, sailing across every page */}
      <Fleet slots={fleet} seaW={pageW * pages} page={page} pageW={pageW} />
      <SeaFront x0={x0} x1={x1} />
    </g>
  );
};
