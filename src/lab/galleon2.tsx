import React from "react";

// The galleon reworked, in the site's flat style (its hull, wood and cream sails, thin spars
// and rigging), with three masts: a rear sail on the mizzen over the stern castle, the main
// mast with a stack of square sails, and a smaller triangular sail on the foremast (and in
// one option a jib on the bowsprit). Waterline at y 0, bow to the right.

export type GalleonOption = "three" | "two" | "jib";
export type Galleon2Props = { option: GalleonOption; name: string; color: string; uid: string };

const WOOD = "#a9744f";
const WOOD_LINE = "#8a5b3b";
const WOOD_DARK = "#5a3522";
const ROPE = "#3b2b20";
const GOLD = "#e0b44f";
const SAIL = "#f4f1ea";
const SHADE = "#dcd5c4";
const WINDOW = "#ffd66b";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";

const DECK = -62;
const MAST = { x: -20, h: 340 };
const FORE = { x: 132, h: 250 };
const MIZZEN = { x: -170, h: 200 };

// A square sail between two yards, a little narrower at the head than at the foot, barely
// bellied, the right half in shade.
const SquareSail: React.FC<{ top: number; bottom: number; topHw: number; bottomHw: number }> = ({ top, bottom, topHw, bottomHw }) => {
  const x = MAST.x;
  const belly = (bottom - top) * 0.08;
  const d = `M ${x - topHw} ${top} L ${x + topHw} ${top} L ${x + bottomHw} ${bottom} Q ${x} ${bottom + belly} ${x - bottomHw} ${bottom} Z`;
  const shade = `M ${x} ${top} L ${x + topHw} ${top} L ${x + bottomHw} ${bottom} Q ${x + bottomHw * 0.5} ${bottom + belly * 0.8} ${x} ${bottom + belly} Z`;
  return (
    <g>
      <path d={d} fill={SAIL} />
      <path d={shade} fill={SHADE} />
      <rect x={x - topHw - 8} y={top - 3} width={topHw * 2 + 16} height={5} rx={2.5} fill={WOOD_DARK} />
    </g>
  );
};

type Rig = { sails: { top: number; bottom: number; topHw: number; bottomHw: number }[]; jib: boolean };
const THREE = [
  { top: DECK - 150, bottom: DECK - 34, topHw: 84, bottomHw: 96 },
  { top: DECK - 252, bottom: DECK - 160, topHw: 68, bottomHw: 82 },
  { top: DECK - 326, bottom: DECK - 262, topHw: 50, bottomHw: 64 },
];
const RIGS: Record<GalleonOption, Rig> = {
  three: { sails: THREE, jib: false },
  two: {
    sails: [
      { top: DECK - 170, bottom: DECK - 34, topHw: 88, bottomHw: 100 },
      { top: DECK - 316, bottom: DECK - 182, topHw: 68, bottomHw: 84 },
    ],
    jib: false,
  },
  jib: { sails: THREE, jib: true },
};
const CASTLE = 54;

export const Galleon2: React.FC<Galleon2Props> = ({ option, name, color, uid }) => {
  const rig = RIGS[option];
  const C = DECK - CASTLE;
  const top = DECK - MAST.h;
  const hull = `M -238 ${C} L -118 ${C} L -118 ${DECK} L 200 ${DECK} L 246 ${DECK - 22} Q 205 40 150 44 L -160 44 Q -222 32 -238 ${C} Z`;
  const sprit = { x: 330, y: DECK - 66 };
  const foreTop = DECK - FORE.h;
  const mizzenTop = C - MIZZEN.h;
  // A triangular sail behind a mast: its luff on the mast, its foot on a boom.
  const fa = (x: number, head: number, foot: number, w: number) =>
    `M ${x} ${head} L ${x} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;
  const faShade = (x: number, head: number, foot: number, w: number) =>
    `M ${x} ${head} L ${x - w * 0.5} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;
  const text = name.toUpperCase();
  const size = 24;
  const squeeze = text.length * size * 0.62 > 300 ? { textLength: 300, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <g>
      {/* Bowsprit and stays */}
      <line x1={232} y1={DECK - 16} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
      <line x1={FORE.x} y1={foreTop} x2={sprit.x} y2={sprit.y} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      <line x1={MAST.x} y1={top} x2={FORE.x} y2={foreTop + 20} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      <line x1={MIZZEN.x} y1={mizzenTop} x2={MAST.x} y2={top + 40} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      {/* Shrouds on the main mast */}
      {[-56, -34, 14, 36].map((dx) => (
        <line key={dx} x1={MAST.x + dx} y1={DECK} x2={MAST.x} y2={rig.sails[0].top - 6} stroke={ROPE} strokeWidth={1.2} opacity={0.6} />
      ))}
      {/* Masts and pennants */}
      {[
        { x: MIZZEN.x, top: mizzenTop, h: MIZZEN.h, w: 7 },
        { x: MAST.x, top, h: MAST.h, w: 9 },
        { x: FORE.x, top: foreTop, h: FORE.h, w: 7 },
      ].map((m, i) => (
        <g key={i}>
          <rect x={m.x - m.w / 2} y={m.top} width={m.w} height={m.h} rx={3} fill={WOOD_DARK} />
          <path d={`M ${m.x + 3} ${m.top} L ${m.x + (i === 1 ? 90 : 66)} ${m.top + 8} L ${m.x + 3} ${m.top + 16} Z`} fill={color} />
        </g>
      ))}
      {/* The rear sail on the mizzen, over the stern castle */}
      <path d={fa(MIZZEN.x - 3, mizzenTop + 18, C - 14, 72)} fill={SAIL} />
      <path d={faShade(MIZZEN.x - 3, mizzenTop + 18, C - 14, 72)} fill={SHADE} />
      <rect x={MIZZEN.x - 3 - 75} y={C - 14} width={75} height={3.5} rx={1.5} fill={WOOD_DARK} />
      {/* The main mast's square sails */}
      {rig.sails.map((s, i) => (
        <SquareSail key={i} {...s} />
      ))}
      {/* The smaller triangular sail on the foremast */}
      <path d={fa(FORE.x - 3, foreTop + 16, DECK - 14, 76)} fill={SAIL} />
      <path d={faShade(FORE.x - 3, foreTop + 16, DECK - 14, 76)} fill={SHADE} />
      <rect x={FORE.x - 3 - 79} y={DECK - 14} width={79} height={3.5} rx={1.5} fill={WOOD_DARK} />
      {/* A jib on the bowsprit */}
      {rig.jib && <path d={`M ${FORE.x + 8} ${foreTop + 34} L ${sprit.x - 6} ${sprit.y + 2} L ${FORE.x + 30} ${DECK - 24} Z`} fill={SHADE} />}
      {/* Hull */}
      <defs>
        <clipPath id={`g2-${uid}`}>
          <path d={hull} />
        </clipPath>
      </defs>
      <path d={hull} fill={WOOD} />
      <g clipPath={`url(#g2-${uid})`}>
        {[DECK + 22, DECK + 52, DECK + 80].map((y) => (
          <rect key={y} x={-260} y={y} width={520} height={3} fill={WOOD_LINE} />
        ))}
        <rect x={-260} y={DECK + 8} width={520} height={6} fill={GOLD} />
        <rect x={-260} y={-1} width={520} height={60} fill={WOOD_DARK} opacity={0.55} />
      </g>
      {[0, 1, 2].map((k) => (
        <rect key={k} x={-224 + k * 34} y={C + CASTLE * 0.26} width={20} height={CASTLE * 0.4} rx={4} fill={WINDOW} />
      ))}
      <path d={`M -240 ${C} L -118 ${C} M -118 ${DECK} L 200 ${DECK} L 246 ${DECK - 22}`} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* The sponsor's name along the hull */}
      <text x={50} y={DECK + 34} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={1.5} fill={SAIL} fontFamily={FONT} {...squeeze}>
        {text}
      </text>
    </g>
  );
};

export const GALLEON_OPTIONS: { option: GalleonOption; label: string }[] = [
  { option: "three", label: "Three masts: rear sail, three square sails on the main, a triangle on the foremast" },
  { option: "two", label: "Three masts: rear sail, two square sails on the main, a triangle on the foremast" },
  { option: "jib", label: "Three masts with three square sails, plus a jib on the bowsprit" },
];
