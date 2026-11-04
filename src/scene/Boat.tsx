import React, { useLayoutEffect, useRef, useState } from "react";
import { boatInfo, type BoatKind, type Member } from "../members";
import { Bob } from "./Motion";

// A member's boat, in the flat style of the teaser's house-boat: a wooden hull, cream sails,
// pennants in the boat's colour, the donor's name on the hull and their logo on the boat:
//  dinghy      one mast, a triangular main sail and a jib; the logo on a flag at the stern;
//  sloop       one mast, a four-sided gaff sail behind it and a jib; the logo on the gaff sail;
//  brigantine  a main mast amidships with big square sails, a rear mast with a triangular
//              sail, a jib; the logo on the big square sail;
//  galleon     three masts (enterprise sponsors); the logo on the main course.
// Drawn with the waterline at y 0, centred on x 0, bow to the right, in world units at full
// scale.

const WOOD = "#a9744f";
const WOOD_LINE = "#8a5b3b";
const WOOD_DARK = "#5a3522";
const SAIL = "#f4f1ea";
const SAIL_SHADE = "#e3dccb";
const ROPE = "#3b2b20";
const GOLD = "#e0b44f";

type Mast = { x: number; h: number };
type Spec = { L: number; masts: Mast[]; jib: boolean };
export const BOAT_SPEC: Record<BoatKind, Spec> = {
  // The galleon is drawn by its own component; its masts here only give its height.
  galleon: { L: 440, masts: [{ x: -10, h: 330 }], jib: true },
  brig: { L: 300, masts: [{ x: -95, h: 150 }, { x: 30, h: 190 }], jib: true },
  sloop: { L: 205, masts: [{ x: 10, h: 125 }], jib: true },
  dinghy: { L: 130, masts: [{ x: 4, h: 140 }], jib: false },
};
// How much bigger each boat is drawn on the sea than its plan (the galleon stands out).
export const KIND_SCALE: Record<BoatKind, number> = { galleon: 1.5, brig: 1, sloop: 1, dinghy: 1 };
// A boat's length on the sea, for spacing.
export const boatLength = (kind: BoatKind) => BOAT_SPEC[kind].L * KIND_SCALE[kind];

export const boatHeight = (kind: BoatKind) => {
  const s = BOAT_SPEC[kind];
  return kind === "galleon" ? GALLEON.deck + GALLEON.main.h + 20 : Math.max(...s.masts.map((m) => m.h)) + s.L * 0.14 + 24;
};

// The brigantine's raised stern deck (quarterdeck) height.
const QUARTERDECK = (L: number) => -L * 0.14 * 1.45;

// Each sailing boat's hull, its deck at -L * 0.14 and its bow's top near (L * 0.55, deck * 1.3)
// where the forestay ends:
//  dinghy      a small open boat, round-bellied, an upright transom, a stripe in its colour;
//  sloop       a sleek yacht, low and long, a sharp overhanging bow, a raked stern, a cream
//              boot stripe;
//  brigantine  a deeper merchant hull with a raised stern deck, lit stern windows and a dark
//              painted band.
const Hull: React.FC<{ kind: Exclude<BoatKind, "galleon">; L: number; color: string }> = ({ kind, L, color }) => {
  const F = L * 0.14;
  const id = `hull-${kind}`;
  let d: string;
  let rail: string;
  let bands: React.ReactNode = null;
  let extras: React.ReactNode = null;
  // A band just under the rail, following its sheer (the rail rises from the stern to the bow).
  const underRail = (x0: number, y0: number, x1: number, y1: number, gap: number, h: number) => {
    const at = (x: number) => y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    return `M ${-L} ${at(-L) + gap} L ${L} ${at(L) + gap} L ${L} ${at(L) + gap + h} L ${-L} ${at(-L) + gap + h} Z`;
  };
  if (kind === "dinghy") {
    const D = L * 0.13;
    d = `M ${-L / 2} ${-F} L ${L * 0.55} ${-F * 1.3} Q ${L * 0.5} ${D * 0.8} ${L * 0.26} ${D} L ${-L * 0.28} ${D} Q ${-L * 0.46} ${D} ${-L * 0.47} ${-F * 0.15} Z`;
    rail = `M ${-L / 2 - 1} ${-F} L ${L * 0.55 + 1} ${-F * 1.3}`;
    bands = <path d={underRail(-L / 2, -F, L * 0.55, -F * 1.3, 2.5, F * 0.2)} fill={color} />;
  } else if (kind === "sloop") {
    // A classic wooden sloop: a curved sheer dipping amidships, a full bow, a rounded stern.
    const D = L * 0.11;
    const stern = { x: -L * 0.5, y: -F * 1.12 };
    const bowTop = { x: L * 0.55, y: -F * 1.3 };
    const sag = { x: 0, y: -F * 0.84 };
    d = `M ${stern.x} ${stern.y} Q ${sag.x} ${sag.y} ${bowTop.x} ${bowTop.y} Q ${L * 0.5} ${D * 0.6} ${L * 0.3} ${D} L ${-L * 0.3} ${D} Q ${-L * 0.53} ${D * 0.6} ${stern.x} ${stern.y} Z`;
    rail = `M ${stern.x - 1} ${stern.y} Q ${sag.x} ${sag.y} ${bowTop.x + 1} ${bowTop.y}`;
    const g = 3;
    const h = Math.max(2.5, L * 0.016);
    bands = (
      <path
        d={`M ${stern.x} ${stern.y + g} Q ${sag.x} ${sag.y + g} ${bowTop.x} ${bowTop.y + g} L ${bowTop.x} ${bowTop.y + g + h} Q ${sag.x} ${sag.y + g + h} ${stern.x} ${stern.y + g + h} Z`}
        fill={SAIL}
      />
    );
  } else {
    const D = L * 0.11;
    const Q = QUARTERDECK(L);
    d = `M ${-L / 2} ${Q} L ${-L * 0.27} ${Q} L ${-L * 0.24} ${-F} L ${L * 0.55} ${-F * 1.3} Q ${L * 0.47} ${D * 0.7} ${L * 0.3} ${D} L ${-L * 0.34} ${D} Q ${-L * 0.49} ${D * 0.7} ${-L * 0.51} ${-F * 0.3} Z`;
    rail = `M ${-L / 2 - 1} ${Q} L ${-L * 0.27} ${Q} M ${-L * 0.25} ${-F} L ${L * 0.55 + 1} ${-F * 1.3}`;
    bands = <path d={underRail(-L * 0.24, -F, L * 0.55, -F * 1.3, 3, F * 0.18)} fill={WOOD_DARK} opacity={0.75} />;
    extras = [0, 1].map((k) => <rect key={k} x={-L * 0.46 + k * L * 0.07} y={Q + F * 0.16} width={L * 0.04} height={F * 0.26} rx={2} fill="#ffd66b" />);
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={WOOD} />
      <g clipPath={`url(#${id})`}>
        {[0.3, 0.62].map((f) => (
          <rect key={f} x={-L} y={-F * 1.4 + F * 1.6 * f} width={L * 2} height={Math.max(1.5, L * 0.012)} fill={WOOD_LINE} />
        ))}
        {bands}
        {/* The shaded bottom, under the waterline */}
        <rect x={-L} y={-1} width={L * 2} height={L * 0.3} fill={WOOD_DARK} opacity={0.55} />
      </g>
      {extras}
      {/* Gunwale */}
      <path d={rail} stroke={WOOD_DARK} strokeWidth={Math.max(2.5, L * 0.022)} strokeLinecap="round" fill="none" />
    </g>
  );
};

// A triangular sail behind a mast (luff on the mast, foot on a boom), and its shaded half.
const triangleSail = (x: number, head: number, foot: number, w: number) =>
  `M ${x} ${head} L ${x} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;
const triangleShade = (x: number, head: number, foot: number, w: number) =>
  `M ${x} ${head} L ${x - w * 0.5} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;

// The member's avatar in a ring of the boat's colour (initials until the picture loads, or
// if there's none). `data-cx` lets the fleet mirror it back when the boat sails left.
type Spot = { cx: number; cy: number; r: number };
const Avatar: React.FC<{ at: Spot; color: string; image?: string | null; name: string; uid: string }> = ({ at, color, image, name, uid }) => {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <g className="unflip" data-cx={at.cx}>
      <defs>
        <clipPath id={`av-${uid}`}>
          <circle cx={at.cx} cy={at.cy} r={at.r} />
        </clipPath>
      </defs>
      <circle cx={at.cx} cy={at.cy} r={at.r + 2.5} fill={color} />
      <circle cx={at.cx} cy={at.cy} r={at.r} fill="#123a4a" />
      {initials && (
        <text x={at.cx} y={at.cy} dy="0.36em" textAnchor="middle" fontSize={at.r * 0.9} fontWeight={700} fill="#fff">
          {initials}
        </text>
      )}
      {image && !broken && (
        <image
          href={image}
          x={at.cx - at.r}
          y={at.cy - at.r}
          width={at.r * 2}
          height={at.r * 2}
          clipPath={`url(#av-${uid})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setBroken(true)}
        />
      )}
    </g>
  );
};

// `forSale` (galleon only): moored, sails furled, a FOR SALE board on the main mast.
// The donor's name painted along the hull in cream capitals, squeezed to fit if long. It
// carries data-cx like the avatar so the fleet keeps it readable when the boat sails left.
const HullName: React.FC<{ name: string; x: number; y: number; size: number; max: number }> = ({ name, x, y, size, max }) => {
  const text = name.toUpperCase();
  const squeeze = text.length * size * 0.62 > max ? { textLength: max, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <g className="unflip" data-cx={x}>
      {/* rotate(0.01): drawn as smooth shapes, not glyphs snapped to whole pixels as the boat bobs */}
      <text transform={`rotate(0.01 ${x} ${y})`} x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={size * 0.06} fill={SAIL} fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif" {...squeeze}>
        {text}
      </text>
    </g>
  );
};
// Name size on each boat's hull.
const NAME_SIZE: Record<BoatKind, number> = { dinghy: 12, sloop: 15, brig: 19, galleon: 24 };

type ShapeProps = { kind: BoatKind; active?: boolean; image?: string | null; name?: string; uid: string; forSale?: boolean };

export const BoatShape: React.FC<ShapeProps> = (props) => (props.kind === "galleon" ? <Galleon {...props} /> : <Sailboat {...props} />);

type Box = { x: number; y: number; w: number; h: number };
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// A square sail on a mast: a little narrower at the head, barely bellied, the right half in
// shade, on its yard. Returns its outline too (for a logo printed on it).
const squareSail = (x: number, top: number, bottom: number, topHw: number, bottomHw: number) => {
  const belly = (bottom - top) * 0.08;
  return {
    d: `M ${x - topHw} ${top} L ${x + topHw} ${top} L ${x + bottomHw} ${bottom} Q ${x} ${bottom + belly} ${x - bottomHw} ${bottom} Z`,
    shade: `M ${x} ${top} L ${x + topHw} ${top} L ${x + bottomHw} ${bottom} Q ${x + bottomHw * 0.5} ${bottom + belly * 0.8} ${x} ${bottom + belly} Z`,
    yard: { x: x - topHw - Math.max(5, topHw * 0.1), y: top - 3, w: topHw * 2 + Math.max(10, topHw * 0.2) },
  };
};
const SquareSail: React.FC<{ x: number; top: number; bottom: number; topHw: number; bottomHw: number }> = (p) => {
  const s = squareSail(p.x, p.top, p.bottom, p.topHw, p.bottomHw);
  return (
    <g>
      <path d={s.d} fill={SAIL} />
      <path d={s.shade} fill={SAIL_SHADE} />
      <rect x={s.yard.x} y={s.yard.y} width={s.yard.w} height={5} rx={2.5} fill={WOOD_DARK} />
    </g>
  );
};
// A triangular sail behind a mast, with its boom.
const TriangleSail: React.FC<{ x: number; head: number; foot: number; w: number }> = ({ x, head, foot, w }) => (
  <g>
    <path d={triangleSail(x, head, foot, w)} fill={SAIL} />
    <path d={triangleShade(x, head, foot, w)} fill={SAIL_SHADE} />
    <rect x={x - w - 3} y={foot} width={w + 3} height={3.5} rx={1.5} fill={WOOD_DARK} />
  </g>
);
// A sail furled along its boom or yard.
const Furled: React.FC<{ x: number; y: number; w: number; h?: number }> = ({ x, y, w, h = 8 }) => <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={SAIL_SHADE} />;

// The member's picture as the main sail's cloth: filling the sail, cropped to its shape, with
// the sail's shading kept over it and a cream edge. Kept the right way round when the boat
// sails left (the inner group is the one the fleet mirrors back). Without a picture, the sail
// stays plain.
const SailPicture: React.FC<{ sail: string; box: Box; image?: string | null; uid: string }> = ({ sail, box, image, uid }) => {
  const [broken, setBroken] = useState(false);
  if (!image || broken) return null;
  return (
    <g>
      <defs>
        <clipPath id={`sail-pic-${uid}`}>
          <path d={sail} />
        </clipPath>
      </defs>
      <g clipPath={`url(#sail-pic-${uid})`}>
        <g className="unflip" data-cx={box.x + box.w / 2}>
          <image href={image} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid slice" onError={() => setBroken(true)} />
        </g>
        {/* Folds in the canvas */}
        {[0.2, 0.55, 0.85].map((f) => (
          <rect key={f} x={box.x + box.w * f} y={box.y} width={box.w * 0.08} height={box.h} fill="#000" opacity={0.07} />
        ))}
      </g>
      <path d={sail} fill="none" stroke={SAIL} strokeWidth={Math.max(2, box.w * 0.025)} strokeLinejoin="round" />
    </g>
  );
};

// A flag on a staff at the stern, flying aft, the logo as its cloth (cream through its
// transparent parts); without a logo, the boat's colour with the donor's initials.
const SternFlag: React.FC<{ staffX: number; deck: number; L: number; color: string; image?: string | null; name: string; uid: string }> = ({ staffX, deck, L, color, image, name, uid }) => {
  const [broken, setBroken] = useState(false);
  const top = { x: staffX - L * 0.06, y: deck - L * 0.5 };
  const w = L * 0.3;
  const h = L * 0.26;
  const a = h * 0.09;
  const x = top.x;
  const y = top.y;
  const d = `M ${x} ${y} C ${x - w * 0.33} ${y - a} ${x - w * 0.66} ${y + a} ${x - w} ${y} L ${x - w} ${y + h} C ${x - w * 0.66} ${y + h + a} ${x - w * 0.33} ${y + h - a} ${x} ${y + h} Z`;
  const logo = image && !broken;
  return (
    <g>
      <line x1={staffX} y1={deck} x2={top.x} y2={top.y - 2} stroke={WOOD_DARK} strokeWidth={Math.max(2.5, L * 0.018)} strokeLinecap="round" />
      <defs>
        <clipPath id={`stern-flag-${uid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={logo ? SAIL : color} />
      <g clipPath={`url(#stern-flag-${uid})`}>
        <g className="unflip" data-cx={x - w / 2}>
          {logo ? (
            <image href={image} x={x - w} y={y - a} width={w} height={h + a * 2} preserveAspectRatio="xMidYMid slice" onError={() => setBroken(true)} />
          ) : (
            <text x={x - w / 2} y={y + h / 2} dy="0.36em" textAnchor="middle" fontSize={h * 0.46} fontWeight={800} fill={SAIL} fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif">
              {initialsOf(name)}
            </text>
          )}
        </g>
        {/* Folds in the cloth, and the hem along the staff */}
        <rect x={x - w * 0.62} y={y - a} width={w * 0.14} height={h + a * 2} fill="#000" opacity={0.1} />
        <rect x={x - w * 0.3} y={y - a} width={w * 0.1} height={h + a * 2} fill="#fff" opacity={0.12} />
        <rect x={x - w * 0.06} y={y - a} width={w * 0.06} height={h + a * 2} fill={SAIL_SHADE} />
      </g>
    </g>
  );
};

const Sailboat: React.FC<ShapeProps> = ({ kind, active = true, image, name = "", uid }) => {
  const { L, masts } = BOAT_SPEC[kind];
  const color = boatInfo(kind).color;
  const deck = -L * 0.14;
  const foot = deck - 12;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const main = masts[masts.length - 1];
  const mainTop = deck - main.h;
  const jibClewX = kind === "brig" ? bow.x - L * 0.12 : main.x + 3;
  // The jib on the forestay: from high on the main mast to the bow (the brigantine's to the
  // end of a bowsprit).
  const tack = kind === "brig" ? { x: bow.x + L * 0.18, y: bow.y - L * 0.05 } : { x: bow.x - L * 0.06, y: bow.y - 6 };
  const jibAt = kind === "brig" ? 0.42 : 0.12;
  const jibHead = { x: main.x + (tack.x - main.x) * jibAt, y: mainTop + (tack.y - mainTop) * jibAt };
  let sails: React.ReactNode = null;
  let furled: React.ReactNode = null;
  let logo: React.ReactNode = null;

  if (kind === "dinghy") {
    const w = Math.min(L * 0.4, main.x + L / 2 - 6);
    sails = <TriangleSail x={main.x - 3} head={mainTop + 8} foot={foot} w={w} />;
    furled = <Furled x={main.x - 3 - w} y={foot - 4} w={w} />;
    // The member's picture on a flag at the stern (initials in the boat's colour without one).
    logo = <SternFlag staffX={-L / 2 + 8} deck={deck} L={L} color={color} image={image} name={name} uid={uid} />;
  } else if (kind === "sloop") {
    // The gaff sail, nearly square: luff on the mast, a gaff almost level from the throat to
    // the peak, the leech straight down to the boom's end.
    const x0 = main.x - 3;
    const w = Math.min(L * 0.5, x0 + L / 2 - 6);
    const throat = mainTop + 18;
    const peak = { x: x0 - w * 0.97, y: mainTop + 10 };
    const d = `M ${x0} ${foot} L ${x0} ${throat} L ${peak.x} ${peak.y} L ${x0 - w} ${foot} Z`;
    const shade = `M ${peak.x} ${peak.y} L ${x0 - w} ${foot} L ${x0 - w * 0.48} ${foot} L ${x0 - w * 0.45} ${(throat + peak.y) / 2} Z`;
    sails = (
      <g>
        <path d={d} fill={SAIL} />
        <path d={shade} fill={SAIL_SHADE} />
        <line x1={x0} y1={throat} x2={peak.x - 4} y2={peak.y - 1} stroke={WOOD_DARK} strokeWidth={3.5} strokeLinecap="round" />
        <rect x={x0 - w - 3} y={foot} width={w + 3} height={3.5} rx={1.5} fill={WOOD_DARK} />
      </g>
    );
    furled = <Furled x={x0 - w} y={foot - 4} w={w} />;
    logo = <SailPicture sail={d} box={{ x: x0 - w, y: peak.y, w, h: foot - peak.y }} image={image} uid={uid} />;
  } else {
    // Brigantine: the rear mast's triangular sail, the main mast's big square sails.
    const rear = masts[0];
    const rw = Math.min(L * 0.2, rear.x + L / 2 - 6);
    const rearFoot = QUARTERDECK(L) - 12;
    const course = { top: deck - 172, bottom: deck - 28, topHw: 74, bottomHw: 86 };
    sails = (
      <g>
        <TriangleSail x={rear.x - 3} head={deck - rear.h + 8} foot={rearFoot} w={rw} />
        <SquareSail x={main.x} {...course} />
      </g>
    );
    furled = (
      <g>
        <Furled x={rear.x - 3 - rw} y={rearFoot - 4} w={rw} />
        <Furled x={main.x - course.topHw - 6} y={course.top} w={course.topHw * 2 + 12} h={10} />
      </g>
    );
    const c = squareSail(main.x, course.top, course.bottom, course.topHw, course.bottomHw);
    logo = <SailPicture sail={c.d} box={{ x: main.x - course.bottomHw, y: course.top, w: course.bottomHw * 2, h: (course.bottom - course.top) * 1.08 }} image={image} uid={uid} />;
  }

  return (
    <g>
      {/* Bowsprit (brigantine), forestay and backstay */}
      {kind === "brig" && <line x1={bow.x - 8} y1={bow.y + 2} x2={tack.x} y2={tack.y} stroke={WOOD_DARK} strokeWidth={4} strokeLinecap="round" />}
      <line x1={main.x} y1={mainTop} x2={tack.x} y2={tack.y} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      <line x1={masts[0].x} y1={deck - masts[0].h} x2={-L / 2 + 4} y2={deck} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      {masts.length > 1 && <line x1={masts[0].x} y1={deck - masts[0].h} x2={main.x} y2={mainTop + 30} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />}
      {/* Masts and pennants */}
      {masts.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 2.5 - L / 300} y={deck - m.h} width={5 + L / 150} height={m.h} rx={2} fill={WOOD_DARK} />
          <path d={`M ${m.x + 2} ${deck - m.h} L ${m.x + 2 + L * 0.12} ${deck - m.h + 6} L ${m.x + 2} ${deck - m.h + 13} Z`} fill={color} />
        </g>
      ))}
      {active ? (
        <>
          {sails}
          <path d={`M ${jibHead.x} ${jibHead.y} L ${tack.x - 3} ${tack.y + 1} L ${jibClewX} ${foot - 2} Z`} fill={SAIL_SHADE} />
        </>
      ) : (
        furled
      )}
      <Hull kind={kind as Exclude<BoatKind, "galleon">} L={L} color={color} />
      {name && <HullName name={name} x={-L * 0.04} y={deck * (kind === "sloop" ? 0.5 : kind === "dinghy" ? 0.42 : 0.4)} size={NAME_SIZE[kind]} max={L * 0.66} />}
      {active ? logo : <Avatar at={{ cx: -L * 0.2, cy: deck * 0.5, r: L * 0.055 }} color={color} image={image} name={name} uid={uid} />}
    </g>
  );
};

// The galleon (enterprise sponsors), sleek, three masts: a low stern castle with lit windows,
// a gold band; a triangular rear sail on the mizzen over the castle, a main mast with two big
// square sails, a smaller triangular sail on the foremast and a jib on the bowsprit, pennants
// in the boat's colour. The sponsor's avatar is on the main
// course, their name along the hull. Former sponsors (and the galleon for sale) have their
// sails furled on the yards.
const GALLEON = { deck: 62, castle: 36, main: { x: -20, h: 340 }, mizzen: { x: -170, h: 190 }, fore: { x: 132, h: 250 } };
const GALLEON_SAILS = [
  { top: -GALLEON.deck - 170, bottom: -GALLEON.deck - 34, topHw: 90, bottomHw: 100 },
  { top: -GALLEON.deck - 316, bottom: -GALLEON.deck - 182, topHw: 70, bottomHw: 86 },
];

// The sponsor's logo printed whole across the main course (fitted, never cropped); their name
// painted there if they have no logo, or a "YOUR LOGO" placeholder when there's no sponsor
// yet (the join panel's preview). Kept readable when the galleon sails left (data-cx).
// `nameless`: without a logo, leave the sail plain (the name is on the hull).
const SailLogo: React.FC<{ sail: string; area: { x: number; y: number; w: number; h: number }; image?: string | null; name: string; uid: string; nameless?: boolean }> = ({
  sail,
  area,
  image,
  name,
  uid,
  nameless = false,
}) => {
  const [broken, setBroken] = useState(false);
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const text = name.toUpperCase();
  const size = Math.min(30, area.h * 0.36);
  const inset = Math.min(10, area.w * 0.06);
  return (
    <g className="unflip" data-cx={cx}>
      <defs>
        <clipPath id={`sail-logo-${uid}`}>
          <path d={sail} />
        </clipPath>
      </defs>
      <g clipPath={`url(#sail-logo-${uid})`}>
        {image && !broken ? (
          <image href={image} x={area.x} y={area.y} width={area.w} height={area.h} preserveAspectRatio="xMidYMid meet" onError={() => setBroken(true)} />
        ) : nameless && name ? null : name ? (
          <text
            x={cx}
            y={cy}
            dy="0.36em"
            textAnchor="middle"
            fontSize={size}
            fontWeight={800}
            fill={WOOD_DARK}
            fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif"
            {...(text.length * size * 0.62 > area.w ? { textLength: area.w, lengthAdjust: "spacingAndGlyphs" as const } : {})}
          >
            {text}
          </text>
        ) : (
          <g>
            <rect x={area.x + inset} y={area.y + inset} width={area.w - inset * 2} height={area.h - inset * 2} rx={inset} fill="none" stroke={WOOD_LINE} strokeWidth={Math.max(1.5, inset * 0.3)} strokeDasharray={`${inset} ${inset * 0.8}`} />
            <text
              x={cx}
              y={cy}
              dy="0.36em"
              textAnchor="middle"
              fontSize={Math.min(24, area.h * 0.24)}
              fontWeight={800}
              fill={WOOD_LINE}
              fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif"
              {...("YOUR LOGO".length * Math.min(24, area.h * 0.24) * 0.62 > area.w - inset * 3 ? { textLength: area.w - inset * 3, lengthAdjust: "spacingAndGlyphs" as const } : {})}
            >
              YOUR LOGO
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

const Galleon: React.FC<ShapeProps> = ({ active: sailing = true, image, name = "", uid, forSale = false }) => {
  const active = sailing && !forSale;
  const color = boatInfo("galleon").color;
  const D = -GALLEON.deck;
  const C = D - GALLEON.castle;
  const { main, mizzen, fore } = GALLEON;
  const top = D - main.h;
  const mizzenTop = C - mizzen.h;
  const foreTop = D - fore.h;
  const hull = `M -238 ${C} L -118 ${C} L -118 ${D} L 200 ${D} L 246 ${D - 22} Q 205 40 150 44 L -160 44 Q -222 32 -238 ${C} Z`;
  const sprit = { x: 330, y: D - 66 };
  // The forestay from the foremast's head to the bowsprit's end, which the jib is set on.
  const stay = (t: number) => ({ x: fore.x + (sprit.x - fore.x) * t, y: foreTop + (sprit.y - foreTop) * t });
  const jibHead = stay(0.18);
  const jibTack = stay(0.97);
  const course = GALLEON_SAILS[0];
  // Former sponsors (sails furled): a small avatar on the stern castle.
  const avatarAt = { cx: -190, cy: C + 30, r: 13 };
  const belly = (course.bottom - course.top) * 0.08;
  const courseSail = `M ${main.x - course.topHw} ${course.top} L ${main.x + course.topHw} ${course.top} L ${main.x + course.bottomHw} ${course.bottom} Q ${main.x} ${course.bottom + belly} ${main.x - course.bottomHw} ${course.bottom} Z`;
  const logoArea = { x: main.x - course.topHw * 0.88, y: course.top + 12, w: course.topHw * 1.76, h: course.bottom - course.top - 18 };
  return (
    <g>
      {/* Bowsprit and stays */}
      <line x1={232} y1={D - 16} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
      <line x1={fore.x} y1={foreTop} x2={sprit.x} y2={sprit.y} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      <line x1={main.x} y1={top} x2={fore.x} y2={foreTop + 20} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      <line x1={mizzen.x} y1={mizzenTop} x2={main.x} y2={top + 40} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      {/* Shrouds on the main mast */}
      {[-60, -36, 16, 40].map((dx) => (
        <line key={dx} x1={main.x + dx} y1={D} x2={main.x} y2={course.top - 6} stroke={ROPE} strokeWidth={1.2} opacity={0.6} />
      ))}
      {/* Masts and pennants */}
      {[
        { x: mizzen.x, top: mizzenTop, h: mizzen.h, w: 7, flag: 66 },
        { x: main.x, top, h: main.h, w: 9, flag: 90 },
        { x: fore.x, top: foreTop, h: fore.h, w: 7, flag: 66 },
      ].map((m, i) => (
        <g key={i}>
          <rect x={m.x - m.w / 2} y={m.top} width={m.w} height={m.h} rx={3} fill={WOOD_DARK} />
          <path d={`M ${m.x + 3} ${m.top} L ${m.x + m.flag} ${m.top + 8} L ${m.x + 3} ${m.top + 16} Z`} fill={color} />
        </g>
      ))}
      {active ? (
        <>
          {/* The rear sail over the stern castle */}
          <path d={triangleSail(mizzen.x - 3, mizzenTop + 18, C - 14, 68)} fill={SAIL} />
          <path d={triangleShade(mizzen.x - 3, mizzenTop + 18, C - 14, 68)} fill={SAIL_SHADE} />
          <rect x={mizzen.x - 74} y={C - 14} width={71} height={3.5} rx={1.5} fill={WOOD_DARK} />
          {/* The main mast's square sails, a little narrower at the head, the right half in shade */}
          {GALLEON_SAILS.map((s, i) => {
            const x = main.x;
            const belly = (s.bottom - s.top) * 0.08;
            return (
              <g key={i}>
                <path d={`M ${x - s.topHw} ${s.top} L ${x + s.topHw} ${s.top} L ${x + s.bottomHw} ${s.bottom} Q ${x} ${s.bottom + belly} ${x - s.bottomHw} ${s.bottom} Z`} fill={SAIL} />
                <path d={`M ${x} ${s.top} L ${x + s.topHw} ${s.top} L ${x + s.bottomHw} ${s.bottom} Q ${x + s.bottomHw * 0.5} ${s.bottom + belly * 0.8} ${x} ${s.bottom + belly} Z`} fill={SAIL_SHADE} />
                <rect x={x - s.topHw - 8} y={s.top - 3} width={s.topHw * 2 + 16} height={5} rx={2.5} fill={WOOD_DARK} />
              </g>
            );
          })}
          {/* The smaller triangular sail on the foremast, and the jib */}
          <TriangleSail x={fore.x - 3} head={foreTop + 16} foot={D - 14} w={70} />
          <path d={`M ${jibHead.x} ${jibHead.y} L ${jibTack.x - 4} ${jibTack.y + 2} L ${fore.x + 34} ${D - 24} Z`} fill={SAIL_SHADE} />
        </>
      ) : (
        // Sails furled: rolled on the yards and the rear boom.
        <g>
          {GALLEON_SAILS.map((s, i) => (
            <rect key={i} x={main.x - s.topHw - 8} y={s.top - 6} width={s.topHw * 2 + 16} height={12} rx={6} fill={SAIL_SHADE} />
          ))}
          <rect x={mizzen.x - 74} y={C - 20} width={71} height={9} rx={4.5} fill={SAIL_SHADE} />
          <rect x={fore.x - 76} y={D - 20} width={73} height={9} rx={4.5} fill={SAIL_SHADE} />
        </g>
      )}
      {/* Hull */}
      <defs>
        <clipPath id={`galleon-${uid}`}>
          <path d={hull} />
        </clipPath>
      </defs>
      <path d={hull} fill={WOOD} />
      <g clipPath={`url(#galleon-${uid})`}>
        {[D + 22, D + 52, D + 80].map((y) => (
          <rect key={y} x={-260} y={y} width={520} height={3} fill={WOOD_LINE} />
        ))}
        <rect x={-260} y={D + 8} width={520} height={6} fill={GOLD} />
        <rect x={-260} y={-1} width={520} height={60} fill={WOOD_DARK} opacity={0.55} />
      </g>
      {[0, 1, 2].map((k) => (
        <rect key={k} x={-224 + k * 34} y={C + GALLEON.castle * 0.26} width={20} height={GALLEON.castle * 0.4} rx={4} fill="#ffd66b" />
      ))}
      <path d={`M -240 ${C} L -118 ${C} M -118 ${D} L 200 ${D} L 246 ${D - 22}`} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />
      {name && !forSale && <HullName name={name} x={50} y={D + 34} size={NAME_SIZE.galleon} max={300} />}
      {forSale ? (
        // A wooden board hung from the main lower yard.
        <g>
          <line x1={main.x - 46} y1={course.top} x2={main.x - 40} y2={course.top + 26} stroke={ROPE} strokeWidth={2} />
          <line x1={main.x + 46} y1={course.top} x2={main.x + 40} y2={course.top + 26} stroke={ROPE} strokeWidth={2} />
          <rect x={main.x - 62} y={course.top + 24} width={124} height={50} rx={6} fill="#f4f1ea" stroke={WOOD_DARK} strokeWidth={4} />
          <text x={main.x} y={course.top + 49} dy="0.36em" textAnchor="middle" fontSize={26} fontWeight={800} fill="#7a2e1d" letterSpacing={1}>
            FOR SALE
          </text>
        </g>
      ) : active ? (
        <SailLogo sail={courseSail} area={logoArea} image={image} name={name} uid={uid} />
      ) : (
        <Avatar at={avatarAt} color={color} image={image} name={name} uid={uid} />
      )}
    </g>
  );
};

// Hides what lies below the sea's surface (y > `below`), outside the boat's bobbing so the
// keel stays underwater however the boat rocks. Used for the galleon, whose deep hull would
// otherwise show through the water.
export const Waterline: React.FC<{ uid: string; on?: boolean; below?: number; children: React.ReactNode }> = ({ uid, on = true, below = 8, children }) =>
  on ? (
    <g clipPath={`url(#waterline-${uid})`}>
      <defs>
        <clipPath id={`waterline-${uid}`}>
          <rect x={-2000} y={-3000} width={4000} height={3000 + below} />
        </clipPath>
      </defs>
      {children}
    </g>
  ) : (
    <>{children}</>
  );

// A member's boat on the sea, bobbing, linking to their profile, with their name on hover.
// The fleet moves it: `parts` hands it the groups to transform (position, the boat's scale
// and heading, the label's height) and `onHold` pauses it while it's pointed at.
// `unflip`: the parts kept the right way round when the boat sails left (avatar, name).
export type BoatParts = { root: SVGGElement; boat: SVGGElement; label: SVGGElement; unflip: SVGGElement[]; top: number };
export const MemberBoat: React.FC<{
  member: Member;
  delay: number;
  parts: (p: BoatParts | null) => void;
  onHold: (held: boolean) => void;
}> = ({ member, delay, parts, onHold }) => {
  const top = boatHeight(member.boat);
  const info = boatInfo(member.boat);
  const root = useRef<SVGGElement>(null);
  const boat = useRef<SVGGElement>(null);
  const label = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    parts({ root: root.current!, boat: boat.current!, label: label.current!, unflip: [...boat.current!.querySelectorAll<SVGGElement>(".unflip")], top });
    return () => parts(null);
  }, [parts, top]);
  return (
    <g ref={root}>
      <a
        href={member.profile}
        target="_blank"
        rel="noreferrer"
        className={`boat${member.active ? "" : " boat-former"}`}
        aria-label={`${member.name}, ${member.active ? info.name : `former explorer (${info.name})`}`}
        onPointerEnter={() => onHold(true)}
        onPointerLeave={() => onHold(false)}
        onFocus={() => onHold(true)}
        onBlur={() => onHold(false)}
      >
        <g ref={boat}>
          <Waterline uid={member.id.replace(/\W/g, "")} on={member.boat === "galleon"}>
            <Bob delay={delay} deg={member.boat === "galleon" ? 0.8 : 1.4}>
              <BoatShape kind={member.boat} active={member.active} image={member.image} name={member.name} uid={member.id.replace(/\W/g, "")} />
            </Bob>
          </Waterline>
        </g>
        <g ref={label} className="boat-label">
          <text textAnchor="middle" className="boat-name">
            {member.name}
          </text>
          <text textAnchor="middle" y={22} className="boat-tier">
            {member.active ? info.name : `Former explorer · ${info.name}`}
          </text>
        </g>
      </a>
    </g>
  );
};
