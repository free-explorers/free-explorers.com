import React from "react";

// The galleon reworked: bolder, with a single main mast carrying one stack of square sails.
// A deep, round hull in rich wood with a high stern castle and a forecastle, a thick gold
// band, lit stern windows, a lantern; a heavy mast with a fighting top, bellied square sails
// on heavy yards, dark shrouds. Waterline at y 0, bow to the right, same scale as the site.

export type GalleonOption = "three" | "two" | "trimmed";
export type Galleon2Props = { option: GalleonOption; name: string; color: string; uid: string };

const WOOD = "#8a5230";
const WOOD_LIGHT = "#a9683d";
const WOOD_LINE = "#6e3f22";
const WOOD_DARK = "#3e2414";
const RAIL = "#4a2a16";
const GOLD = "#e0b44f";
const SAIL = "#f6f1e6";
const SAIL_SHADE = "#dcd3bf";
const WINDOW = "#ffd66b";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";

const DECK = -70; // main deck height
const CASTLE = { x0: -250, x1: -118, top: DECK - 82 };
const FORECASTLE = { x0: 138, x1: 232, top: DECK - 36 };
const MAST = { x: 6, top: DECK - 380 };

// The hull outline: stern castle, waist, forecastle and a beak rising at the bow, a deep
// round belly.
const HULL = [
  `M ${CASTLE.x0 - 6} ${CASTLE.top}`,
  `L ${CASTLE.x1} ${CASTLE.top}`,
  `L ${CASTLE.x1 + 14} ${DECK}`,
  `L ${FORECASTLE.x0 - 10} ${DECK}`,
  `L ${FORECASTLE.x0} ${FORECASTLE.top}`,
  `L ${FORECASTLE.x1} ${FORECASTLE.top}`,
  `L 268 ${DECK - 58}`,
  `L 274 ${DECK - 46}`,
  `Q 236 ${DECK + 20} 214 ${DECK + 58}`,
  `Q 168 52 70 56`,
  `L -150 56`,
  `Q -236 50 -252 ${DECK + 30}`,
  `Q -262 ${DECK - 30} ${CASTLE.x0 - 6} ${CASTLE.top}`,
  "Z",
].join(" ");

// A bellied square sail between two yards, two-tone (the right half in shade), with an
// optional gold trim.
const SquareSail: React.FC<{ hw: number; top: number; bottom: number; trimmed?: boolean }> = ({ hw, top, bottom, trimmed }) => {
  const x = MAST.x;
  const belly = (bottom - top) * 0.22;
  const d = `M ${x - hw} ${top} L ${x + hw} ${top} Q ${x + hw * 1.12} ${(top + bottom) / 2} ${x + hw * 0.96} ${bottom} Q ${x} ${bottom + belly} ${x - hw * 0.96} ${bottom} Q ${x - hw * 1.12} ${(top + bottom) / 2} ${x - hw} ${top} Z`;
  const shade = `M ${x} ${top} L ${x + hw} ${top} Q ${x + hw * 1.12} ${(top + bottom) / 2} ${x + hw * 0.96} ${bottom} Q ${x + hw * 0.5} ${bottom + belly * 0.9} ${x} ${bottom + belly} Z`;
  return (
    <g>
      <path d={d} fill={SAIL} />
      <path d={shade} fill={SAIL_SHADE} />
      {trimmed && <path d={d} fill="none" stroke={GOLD} strokeWidth={7} strokeLinejoin="round" />}
      {/* Reef bands */}
      {[0.32, 0.62].map((f) => (
        <path
          key={f}
          d={`M ${x - hw * 0.99} ${top + (bottom - top) * f} Q ${x} ${top + (bottom - top) * f + belly * f * 1.1} ${x + hw * 0.99} ${top + (bottom - top) * f}`}
          fill="none"
          stroke={SAIL_SHADE}
          strokeWidth={2.5}
          opacity={0.9}
        />
      ))}
      {/* The yard */}
      <rect x={x - hw - 12} y={top - 6} width={hw * 2 + 24} height={10} rx={5} fill={WOOD_DARK} />
    </g>
  );
};

const SAILS: Record<GalleonOption, { hw: number; top: number; bottom: number }[]> = {
  three: [
    { hw: 128, top: DECK - 196, bottom: DECK - 56 },
    { hw: 104, top: DECK - 300, bottom: DECK - 212 },
    { hw: 74, top: DECK - 368, bottom: DECK - 312 },
  ],
  two: [
    { hw: 142, top: DECK - 220, bottom: DECK - 56 },
    { hw: 116, top: DECK - 358, bottom: DECK - 236 },
  ],
  trimmed: [
    { hw: 128, top: DECK - 196, bottom: DECK - 56 },
    { hw: 104, top: DECK - 300, bottom: DECK - 212 },
    { hw: 74, top: DECK - 368, bottom: DECK - 312 },
  ],
};

export const Galleon2: React.FC<Galleon2Props> = ({ option, name, color, uid }) => {
  const sails = SAILS[option];
  const text = name.toUpperCase();
  const size = 26;
  const squeeze = text.length * size * 0.62 > 300 ? { textLength: 300, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <g>
      {/* Bowsprit and stays */}
      <line x1={250} y1={DECK - 50} x2={340} y2={DECK - 104} stroke={WOOD_DARK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${MAST.x} ${MAST.top + 8} L 336 ${DECK - 102}`} stroke={RAIL} strokeWidth={2} opacity={0.8} fill="none" />
      <path d={`M ${MAST.x} ${MAST.top + 8} L ${CASTLE.x0 + 6} ${CASTLE.top}`} stroke={RAIL} strokeWidth={2} opacity={0.8} fill="none" />
      {/* Shrouds: rope ladders from the rails up to the fighting top */}
      {[-1, 1].map((side) => (
        <g key={side} stroke={RAIL} strokeWidth={1.6} opacity={0.75}>
          {[0, 1, 2].map((k) => (
            <line key={k} x1={MAST.x + side * (26 + k * 22)} y1={DECK - 4} x2={MAST.x + side * 4} y2={DECK - 220} />
          ))}
        </g>
      ))}
      {/* The main mast, with its pennant */}
      <rect x={MAST.x - 7} y={MAST.top} width={14} height={-MAST.top + DECK + 6} rx={4} fill={WOOD_DARK} />
      <path d={`M ${MAST.x + 6} ${MAST.top - 2} C ${MAST.x + 50} ${MAST.top - 14} ${MAST.x + 90} ${MAST.top + 10} ${MAST.x + 136} ${MAST.top + 2} L ${MAST.x + 6} ${MAST.top + 22} Z`} fill={color} />
      {/* Sails, from the course up */}
      {sails.map((s, i) => (
        <SquareSail key={i} {...s} trimmed={option === "trimmed"} />
      ))}
      {/* Fighting top (in the three-sail rig, between course and topsail) */}
      {option !== "two" && (
        <g>
          <rect x={MAST.x - 30} y={DECK - 212} width={60} height={12} rx={3} fill={WOOD_DARK} />
          <rect x={MAST.x - 26} y={DECK - 226} width={52} height={14} rx={3} fill={WOOD} />
        </g>
      )}
      {/* Hull */}
      <defs>
        <clipPath id={`g2-${uid}`}>
          <path d={HULL} />
        </clipPath>
      </defs>
      <path d={HULL} fill={WOOD} />
      <g clipPath={`url(#g2-${uid})`}>
        {/* Lighter upper works, planks */}
        <rect x={-300} y={CASTLE.top - 10} width={600} height={DECK + 22 - CASTLE.top + 10} fill={WOOD_LIGHT} />
        {[DECK + 34, DECK + 62, DECK + 92, DECK + 118].map((y) => (
          <rect key={y} x={-300} y={y} width={600} height={3.5} fill={WOOD_LINE} />
        ))}
        {/* The thick gold band, and a thin one above it */}
        <rect x={-300} y={DECK + 12} width={600} height={12} fill={GOLD} />
        <rect x={-300} y={DECK - 6} width={600} height={4} fill={GOLD} />
        {/* Below the waterline */}
        <rect x={-300} y={-2} width={600} height={80} fill={WOOD_DARK} opacity={0.6} />
      </g>
      {/* Stern castle: gold trim and lit windows; forecastle trim */}
      <rect x={CASTLE.x0 - 8} y={CASTLE.top - 8} width={CASTLE.x1 - CASTLE.x0 + 14} height={10} rx={4} fill={RAIL} />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={CASTLE.x0 + 14 + k * 36} y={CASTLE.top + 18} width={22} height={28} rx={11} fill={WINDOW} stroke={GOLD} strokeWidth={3} />
      ))}
      <rect x={FORECASTLE.x0 - 4} y={FORECASTLE.top - 8} width={FORECASTLE.x1 - FORECASTLE.x0 + 8} height={9} rx={4} fill={RAIL} />
      <rect x={CASTLE.x1 + 6} y={DECK - 8} width={FORECASTLE.x0 - CASTLE.x1 - 12} height={9} rx={4} fill={RAIL} />
      {/* Stern lantern */}
      <g>
        <circle cx={CASTLE.x0 + 4} cy={CASTLE.top - 34} r={26} fill={WINDOW} opacity={0.18} />
        <rect x={CASTLE.x0 + 1} y={CASTLE.top - 16} width={6} height={10} fill={RAIL} />
        <path d={`M ${CASTLE.x0 - 8} ${CASTLE.top - 18} L ${CASTLE.x0 + 16} ${CASTLE.top - 18} L ${CASTLE.x0 + 12} ${CASTLE.top - 46} L ${CASTLE.x0 - 4} ${CASTLE.top - 46} Z`} fill={WINDOW} stroke={RAIL} strokeWidth={3} />
      </g>
      {/* The sponsor's name along the hull */}
      <text x={30} y={DECK + 40} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={2} fill={SAIL} fontFamily={FONT} {...squeeze}>
        {text}
      </text>
    </g>
  );
};

export const GALLEON_OPTIONS: { option: GalleonOption; label: string }[] = [
  { option: "three", label: "Three stacked sails (course, topsail, topgallant) and a fighting top" },
  { option: "two", label: "Two huge sails: the boldest silhouette" },
  { option: "trimmed", label: "Three sails trimmed in gold, for sponsors" },
];
