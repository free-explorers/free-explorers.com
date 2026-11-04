// Ported from the Veshell teaser (veshell_video/teaser/src/components/Lighthouse.tsx).
import React from "react";
import { FE_BODY, FE_BULB, FE_BULB_BASE, FE_RAYS } from "./freeExplorersPaths";

// The Free Explorers lighthouse (variant H): the official logo's top — hands raising the
// bulb — continued into a tall tower with portholes, a door and a rock. Drawn in the logo's
// 232-unit space; the bulb's centre is at (116, 103).
const JOIN = 212;
// With the stone tower, a little more of the logo's white body shows below the hands (the
// wrists, as in the official logo) before the stone starts.
const STONE_JOIN = JOIN + 20;
const TOP_L = 71.5;
const TOP_R = 160.5;

// Tower shapes: how far down the rock is, and how much the tower flares (per unit of height).
// H is the first long-tower take; I and J are slimmer and taller.
export const LIGHTHOUSE_VARIANTS = {
  H: { bottom: 430, spread: 0.12, portholes: 3 },
  I: { bottom: 560, spread: 0.05, portholes: 4 },
  // Between H and I: a touch less slender than I.
  K: { bottom: 510, spread: 0.07, portholes: 4 },
  J: { bottom: 680, spread: 0.035, portholes: 5 },
};
export type LighthouseVariant = keyof typeof LIGHTHOUSE_VARIANTS;

// Height from the top ray (y 26) to the rock's foot, in logo units.
export const lighthouseHeight = (v: LighthouseVariant) => LIGHTHOUSE_VARIANTS[v].bottom + 10 - 26;
export const lighthouseFoot = (v: LighthouseVariant) => LIGHTHOUSE_VARIANTS[v].bottom + 10;

// Beams: one after another along the logo's rays, from the left over to the right like a
// turning wheel, once, each flaring out to the horizon. `time` 0 is the first beam.
const BULB = { x: 116, y: 103 };
// Angle going clockwise over the top from the left (the side rays sit a little below the
// horizontal, so the left one is pulled round to the start).
const sweep = (r: { cx: number; cy: number }) => {
  const a = Math.atan2(r.cy - BULB.y, r.cx - BULB.x);
  return a > Math.PI / 2 ? a - 2 * Math.PI : a;
};
// Each ray as a segment: its centre, the outward direction along its length, half-length.
const RAYS = FE_RAYS.map((r, index) => {
  const [a, b, c, d, e, f] = r.matrix.split(",").map(Number);
  const lx = r.x + r.w / 2;
  const ly = r.y + r.h / 2;
  const cx = a * lx + c * ly + e;
  const cy = b * lx + d * ly + f;
  // The rect's long side is its local y axis.
  let dx = c;
  let dy = d;
  const n = Math.hypot(dx, dy);
  dx /= n;
  dy /= n;
  if (dx * (cx - BULB.x) + dy * (cy - BULB.y) < 0) {
    dx = -dx;
    dy = -dy;
  }
  return { index, cx, cy, dx, dy, half: r.h / 2, width: r.w };
}).sort((p, q) => sweep(p) - sweep(q));

// How lit each beam is at `time` (0 = not started), its reach (0..1) and fade (0..1).
const beamState = (time: number, i: number) => {
  const t = time - i * BEAM_STEP;
  if (t < 0) return { reach: 0, fade: 0 };
  const last = i === RAYS.length - 1;
  return {
    reach: 1 - Math.pow(1 - Math.min(1, t / 8), 3),
    fade: last || t < 20 ? 1 : Math.max(0, 1 - (t - 20) / 16),
  };
};
// How far each logo pill (by its index in FE_RAYS) has morphed into light: 0 pill, 1 light.
const pillLight = (time: number, on: number) => {
  const light = FE_RAYS.map(() => 0);
  RAYS.forEach((r, i) => {
    const { reach, fade } = beamState(time, i);
    light[r.index] = Math.min(1, reach * 1.4) * fade * on;
  });
  return light;
};

export const BEAM_STEP = 15; // frames between one ray's beam and the next (a half-beat, an eighth note)
export const BEAM_COUNT = RAYS.length;
// The beam that stays lit (the last of the sweep): a point on its centre line and its
// direction, in the logo's units.
export const LAST_BEAM = (() => {
  const r = RAYS[RAYS.length - 1];
  return { x: r.cx, y: r.cy, dx: r.dx, dy: r.dy };
})();
const BEAM_LENGTH = 2600;

// The beam in flat style, like the bulb's halo: nested wedges of solid pale light, a wide
// faint one and a narrower one inside it (brighter where they overlap), each flaring at its
// own angle from the pill. The pill itself stays as a solid white stub at the beam's root.
const BEAM_LAYERS = [
  { half: (9 * Math.PI) / 180, opacity: 0.22 },
  { half: (4 * Math.PI) / 180, opacity: 0.3 },
];
// Warm lamp light, between amber and pale yellow.
const BEAM_COLOR = "#ffd072";
// Along its length the beam holds full strength near the lamp, then fades out to nothing at
// its far end (the sides stay sharp).
const BEAM_FADE = [
  { at: 0, opacity: 1 },
  { at: 0.12, opacity: 1 },
  { at: 1, opacity: 0 },
];

// Beams growing out of the logo's pills, along each one's direction: they shoot out, hold,
// and fade out gently as the next ones come on (the last one stays).
const Beams: React.FC<{ time: number; on: number }> = ({ time, on }) => (
  <g opacity={on}>
    {RAYS.map((r, i) => {
      const { reach, fade } = beamState(time, i);
      if (fade <= 0 || reach <= 0) return null;
      const len = r.half * 2 + (BEAM_LENGTH - r.half * 2) * reach;
      // From the pill itself: its inner end, as wide as the pill, flaring to the horizon.
      // Inner end of the pill's straight part (its rounded cap is added below).
      const ix = r.cx - r.dx * (r.half - r.width / 2);
      const iy = r.cy - r.dy * (r.half - r.width / 2);
      const px = -r.dy;
      const py = r.dx;
      const w0 = r.width / 2;
      // The start is rounded like the pill: a half-circle cap behind its inner end.
      const bx = ix - r.dx * w0;
      const by = iy - r.dy * w0;
      const wedge = (length: number, half: number) => {
        const w1 = w0 + length * Math.tan(half);
        const fx = ix + r.dx * length;
        const fy = iy + r.dy * length;
        return `M${ix + px * w0} ${iy + py * w0} L${fx + px * w1} ${fy + py * w1} L${fx - px * w1} ${fy - py * w1} L${ix - px * w0} ${iy - py * w0} A${w0} ${w0} 0 0 0 ${bx} ${by} A${w0} ${w0} 0 0 0 ${ix + px * w0} ${iy + py * w0} Z`;
      };
      // The pill's stub: the pill itself, solid white, at the beam's root.
      const stub = r.half * 2 - r.width;
      const ox = ix + r.dx * stub;
      const oy = iy + r.dy * stub;
      // The fade runs over the beam's full length (not its current reach), so a growing beam
      // shows its strong part first.
      const fadeId = `fe-beam-fade-${i}`;
      return (
        <g key={i} opacity={fade}>
          <defs>
            <linearGradient id={fadeId} gradientUnits="userSpaceOnUse" x1={ix} y1={iy} x2={ix + r.dx * BEAM_LENGTH} y2={iy + r.dy * BEAM_LENGTH}>
              {BEAM_FADE.map((f) => (
                <stop key={f.at} offset={f.at} stopColor={BEAM_COLOR} stopOpacity={f.opacity} />
              ))}
            </linearGradient>
          </defs>
          {BEAM_LAYERS.map((l) => (
            <path key={l.half} d={wedge(len, l.half)} fill={`url(#${fadeId})`} opacity={l.opacity} />
          ))}
          <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#fff" strokeWidth={r.width} strokeLinecap="round" />
        </g>
      );
    })}
  </g>
);

// When `tower` is given, the tower is built in stone to match the church around it (stone
// courses, pointed lit windows, a pointed wooden door, a gallery under the top); only the
// official logo's top (hands, bulb, rays) stays white.
export type TowerStyle = { stone: string; line: string; trim: string; door: string; lit: number };

export const Lighthouse: React.FC<{ color?: string; hole: string; beams?: number; time?: number; variant?: LighthouseVariant; tower?: TowerStyle }> = ({
  color = "#fff",
  hole,
  beams = 0,
  time = 0,
  variant = "H",
  tower,
}) => {
  const { bottom: BOTTOM, spread, portholes } = LIGHTHOUSE_VARIANTS[variant];
  const light = beams > 0 ? pillLight(time, beams) : FE_RAYS.map(() => 0);
  const BL = TOP_L - (BOTTOM - JOIN) * spread;
  const BR = TOP_R + (BOTTOM - JOIN) * spread;
  // Portholes and the door are evenly spaced: the same gap between each porthole and
  // between the last porthole and the top of the door.
  const R = 8;
  const first = JOIN + 38;
  const doorTop = BOTTOM - 40;
  const gap = (doorTop - first - R - 2 * R * (portholes - 1)) / portholes;
  const holes = Array.from({ length: portholes }, (_, i) => first + i * (2 * R + gap));
  return (
  <g>
    <defs>
      <clipPath id="fe-top">
        <rect x={0} y={0} width={232} height={tower ? STONE_JOIN : JOIN} />
      </clipPath>

    </defs>
    {beams > 0 && <Beams time={time} on={beams} />}
    {tower ? (
      // Down to the foot (the white version has its rock below BOTTOM).
      <StoneTower bl={BL - 10 * spread} br={BR + 10 * spread} bottom={BOTTOM + 10} windows={holes} style={tower} />
    ) : (
      <>
      <path d={`M${TOP_L} ${JOIN - 2} L${TOP_R} ${JOIN - 2} L${BR} ${BOTTOM} L${BL} ${BOTTOM} Z`} fill={color} />
      {holes.map((y) => (
        <circle key={y} cx={116} cy={y} r={8} fill={hole} />
      ))}
      <path d={`M104 ${BOTTOM} L104 ${BOTTOM - 28} A12 12 0 0 1 128 ${BOTTOM - 28} L128 ${BOTTOM} Z`} fill={hole} />
      <path
        d={`M${BL - 34} ${BOTTOM + 10} Q${BL - 18} ${BOTTOM - 8} ${BL + 12} ${BOTTOM - 4} L${BR - 12} ${BOTTOM - 4} Q${BR + 18} ${BOTTOM - 8} ${BR + 34} ${BOTTOM + 10} Z`}
        fill={color}
      />
      </>
    )}
    <path d={FE_BODY} fill={color} clipPath="url(#fe-top)" />
    <path d={FE_BULB} fill={color} />
    <path d={FE_BULB_BASE} fill={color} />
    {/* The pills, each morphing into its beam while it's lit */}
    {FE_RAYS.map((r, i) => (
      <rect key={i} rx={8} ry={8} x={r.x} y={r.y} width={r.w} height={r.h} transform={`matrix(${r.matrix})`} fill={color} opacity={1 - light[i]} />
    ))}
  </g>
  );
};

// The stone tower: from the gallery under the logo's top down to the ground.
const StoneTower: React.FC<{ bl: number; br: number; bottom: number; windows: number[]; style: TowerStyle }> = ({ bl, br, bottom, windows, style }) => {
  const top = STONE_JOIN;
  // The tower's sides at its top, continuing their slope from the logo's shoulders.
  const k = (br - TOP_R) / (bottom - JOIN);
  const tl = TOP_L - (top - JOIN) * k;
  const tr = TOP_R + (top - JOIN) * k;
  const outline = `M${tl} ${top - 2} L${tr} ${top - 2} L${br} ${bottom} L${bl} ${bottom} Z`;
  const courses = Math.floor((bottom - top) / 14);
  const lancet = (cy: number, w: number, h: number) =>
    `M ${116 - w / 2} ${cy + h / 2} L ${116 - w / 2} ${cy - h / 2 + w / 2} Q ${116 - w / 2} ${cy - h / 2} 116 ${cy - h / 2 - w * 0.25} Q ${116 + w / 2} ${cy - h / 2} ${116 + w / 2} ${cy - h / 2 + w / 2} L ${116 + w / 2} ${cy + h / 2} Z`;
  return (
    <g>
      <defs>
        <clipPath id="fe-tower">
          <path d={outline} />
        </clipPath>
      </defs>
      <path d={outline} fill={style.stone} />
      <g clipPath="url(#fe-tower)">
        {Array.from({ length: courses }, (_, r) => (
          <rect key={r} x={0} y={top + (r + 1) * 14} width={232} height={1.2} fill={style.line} />
        ))}
        {/* Darker shaded side */}
        <path d={`M${tr - 30} ${top} L${tr} ${top} L${br} ${bottom} L${br - 44} ${bottom} Z`} fill="#000" opacity={0.14} />
        {/* Shadow under the gallery */}
        <rect x={0} y={top - 2} width={232} height={14} fill="#000" opacity={0.2} />
      </g>
      {/* Round stone windows up the tower: a ring of stone blocks around a lit glass with a
          wooden cross bar */}
      {windows.map((y) => (
        <g key={y}>
          <circle cx={116} cy={y} r={11} fill={style.line} />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
            return (
              <line key={k} x1={116 + Math.cos(a) * 7.5} y1={y + Math.sin(a) * 7.5} x2={116 + Math.cos(a) * 11} y2={y + Math.sin(a) * 11} stroke={style.stone} strokeWidth={0.9} />
            );
          })}
          <circle cx={116} cy={y} r={7.5} fill="#3b2b20" />
          <circle cx={116} cy={y} r={6.4} fill="#123a4a" />
          <circle cx={116} cy={y} r={6.4} fill="#ffd66b" opacity={style.lit} />
          <rect x={115.4} y={y - 6.4} width={1.2} height={12.8} fill="#7a4b2e" />
          <rect x={109.6} y={y - 0.6} width={12.8} height={1.2} fill="#7a4b2e" />
        </g>
      ))}
      {/* A double wooden door with a round arch: stone surround, plank leaves, iron strap
          hinges and ring handles (the entrance) */}
      {(() => {
        const w = 38;
        const h = 55;
        const x0 = 116 - w / 2;
        const y0 = bottom - h;
        const arch = (inset: number) =>
          `M ${x0 + inset} ${bottom} L ${x0 + inset} ${y0 + w / 2} A ${w / 2 - inset} ${w / 2 - inset} 0 0 1 ${x0 + w - inset} ${y0 + w / 2} L ${x0 + w - inset} ${bottom} Z`;
        return (
          <g>
            <path d={`M ${x0 - 4} ${bottom} L ${x0 - 4} ${y0 + w / 2} A ${w / 2 + 4} ${w / 2 + 4} 0 0 1 ${x0 + w + 4} ${y0 + w / 2} L ${x0 + w + 4} ${bottom} Z`} fill={style.line} />
            <path d={arch(0)} fill="#7a4b2e" />
            <clipPath id="fe-door">
              <path d={arch(0)} />
            </clipPath>
            <g clipPath="url(#fe-door)">
              {Array.from({ length: 6 }, (_, k) => (
                <rect key={k} x={x0 + (k + 1) * (w / 6) - 0.4} y={y0} width={0.8} height={h} fill="#5a3522" />
              ))}
              <rect x={115.4} y={y0} width={1.2} height={h} fill="#3f2616" />
              {/* Iron strap hinges */}
              {[0.42, 0.78].map((f, k) => (
                <g key={k}>
                  <rect x={x0} y={y0 + h * f} width={w * 0.38} height={1.8} rx={0.9} fill="#2f2e36" />
                  <rect x={x0 + w * 0.62} y={y0 + h * f} width={w * 0.38} height={1.8} rx={0.9} fill="#2f2e36" />
                </g>
              ))}
            </g>
            {/* Ring handles */}
            <circle cx={113.6} cy={y0 + h * 0.62} r={1.5} fill="none" stroke="#b8862e" strokeWidth={0.8} />
            <circle cx={118.4} cy={y0 + h * 0.62} r={1.5} fill="none" stroke="#b8862e" strokeWidth={0.8} />
          </g>
        );
      })()}
      {/* Gallery under the logo's top, and a plinth at the foot */}
      <rect x={tl - 12} y={top - 6} width={tr - tl + 24} height={9} rx={2} fill={style.trim} />
      {Array.from({ length: 7 }, (_, k) => (
        <rect key={k} x={tl - 8 + k * ((tr - tl + 16) / 6) - 1.5} y={top - 16} width={3} height={10} fill={style.trim} />
      ))}
      <rect x={tl - 12} y={top - 18} width={tr - tl + 24} height={3} rx={1.5} fill={style.trim} />
      <rect x={bl - 6} y={bottom - 8} width={br - bl + 12} height={12} rx={2} fill={style.line} />
    </g>
  );
};
