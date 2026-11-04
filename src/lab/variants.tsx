import React from "react";
import type { BoatKind } from "../members";
import { Avatar, PlankHull, RIG, hullFor, inTriangle, jib, plan, square, triangle, triangleShade, gaff } from "./proposals";

// Variations of the current (Teaser-style) boats, five per boat type, each showing the
// donor's identity a different way: a big logo on the sail, the whole sail printed with it,
// a masthead flag, a spinnaker, a streamer with their name, their name painted on the hull.
// Wood hulls, two-tone cream sails, as on the site. Waterline at y 0, bow to the right.

export type VariantProps = { image?: string; name: string; uid: string; color: string };
export type Variant = { id: string; label: string; Boat: React.FC<VariantProps> };

const SAIL = "#f4f1ea";
const SHADE = "#dcd5c4";
const WOOD_DARK = "#5a3522";
const ROPE = "#3b2b20";
const TEAL = "#006888";
const BRASS = "#d9a441";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";

// ---------------------------------------------------------------------------------------
// Sails (two-tone, as on the site): fore-and-aft shapes as paths, with their shade.

type FA = { d: string; shade: string; box: { x: number; y: number; w: number; h: number }; spot: { cx: number; cy: number; r: number } };
const quadSpot = (pts: [number, number][]) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = xs.reduce((a, b) => a + b) / pts.length;
  const cy = ys.reduce((a, b) => a + b) / pts.length;
  const r = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.32;
  return { cx, cy, r };
};
const poly = (pts: [number, number][]) => `M ${pts.map((p) => p.join(" ")).join(" L ")} Z`;
const sails = {
  triangle: (mx: number, top: number, foot: number, w: number): FA => ({
    d: triangle(mx, top, foot, w),
    shade: triangleShade(mx, top, foot, w),
    box: { x: mx - w, y: top, w, h: foot - top },
    spot: inTriangle(mx, top, foot, w),
  }),
  gaff: (mx: number, top: number, foot: number, w: number): FA => {
    const pts: [number, number][] = [
      [mx, top + 26],
      [mx - w * 0.82, top],
      [mx - w, foot],
      [mx, foot],
    ];
    return { d: gaff(mx, top, foot, w), shade: poly([pts[1], pts[2], [mx - w * 0.45, foot]]), box: { x: mx - w, y: top, w, h: foot - top }, spot: quadSpot(pts) };
  },
  lug: (mx: number, top: number, foot: number, w: number): FA => {
    const pts: [number, number][] = [
      [mx + w * 0.22, top + (foot - top) * 0.2],
      [mx - w * 0.72, top],
      [mx - w * 0.8, foot],
      [mx + w * 0.2, foot],
    ];
    return { d: poly(pts), shade: poly([pts[1], pts[2], [mx - w * 0.3, foot]]), box: { x: mx - w * 0.8, y: top, w: w, h: foot - top }, spot: quadSpot(pts) };
  },
  sprit: (mx: number, top: number, foot: number, w: number): FA => {
    const pts: [number, number][] = [
      [mx, top + (foot - top) * 0.12],
      [mx - w * 0.8, top - 4],
      [mx - w, foot],
      [mx, foot],
    ];
    return { d: poly(pts), shade: poly([pts[1], pts[2], [mx - w * 0.45, foot]]), box: { x: mx - w, y: top, w, h: foot - top }, spot: quadSpot(pts) };
  },
};

// A fore-and-aft sail drawn two-tone, or printed with the donor's picture.
const FASail: React.FC<{ s: FA; printed?: { image?: string; name: string; uid: string } }> = ({ s, printed }) =>
  printed ? (
    <g>
      <defs>
        <clipPath id={`print-${printed.uid}`}>
          <path d={s.d} />
        </clipPath>
      </defs>
      <path d={s.d} fill={SAIL} />
      {printed.image ? (
        <image href={printed.image} x={s.box.x} y={s.box.y} width={s.box.w} height={s.box.h} clipPath={`url(#print-${printed.uid})`} preserveAspectRatio="xMidYMid slice" />
      ) : null}
      <path d={s.shade} fill="#000" opacity={0.08} />
      <path d={s.d} fill="none" stroke={SAIL} strokeWidth={3} />
    </g>
  ) : (
    <g>
      <path d={s.d} fill={SAIL} />
      <path d={s.shade} fill={SHADE} />
    </g>
  );

// A balloon spinnaker ahead of the mast, flying to the end of a bowsprit, with the logo in
// its middle.
const Spinnaker: React.FC<{ mx: number; top: number; deck: number; tackX: number; image?: string; name: string; uid: string; ring: string }> = ({
  mx,
  top,
  deck,
  tackX,
  image,
  name,
  uid,
  ring,
}) => {
  const span = tackX - mx;
  const d = `M ${mx + 4} ${top + 6} Q ${tackX + span * 0.55} ${top + (deck - top) * 0.3} ${tackX} ${deck - 8} L ${mx + span * 0.18} ${deck - 14} Q ${mx + span * 0.05} ${(top + deck) / 2} ${mx + 4} ${top + 6} Z`;
  const cx = mx + span * 0.62;
  const cy = top + (deck - top) * 0.52;
  return (
    <g>
      <path d={d} fill={SAIL} />
      <path d={`M ${mx + 4} ${top + 6} Q ${mx + span * 0.05} ${(top + deck) / 2} ${mx + span * 0.18} ${deck - 14} L ${mx + span * 0.4} ${deck - 12} Q ${mx + span * 0.3} ${(top + deck) / 2} ${mx + 4} ${top + 6} Z`} fill={SHADE} />
      <Avatar cx={cx} cy={cy} r={span * 0.3} ring={ring} ringWidth={span * 0.03} image={image} name={name} uid={`spin-${uid}`} />
    </g>
  );
};

// The masthead flag, Teaser style (cream, the avatar on a teal disc).
const Flag: React.FC<{ x: number; top: number; w: number; image?: string; name: string; uid: string }> = ({ x, top, w, image, name, uid }) => {
  const h = w * 0.66;
  return (
    <g>
      <path d={`M ${x + 3} ${top + 2} Q ${x + w * 0.5} ${top - 6} ${x + w} ${top + 4} L ${x + w} ${top + h} Q ${x + w * 0.5} ${top + h - 8} ${x + 3} ${top + h} Z`} fill={SAIL} />
      <Avatar cx={x + 3 + w / 2} cy={top + h / 2 + 1} r={h * 0.36} ring={TEAL} ringWidth={h * 0.06} image={image} name={name} uid={`flag-${uid}`} />
    </g>
  );
};

// A long streamer flying from the masthead with the donor's name on it.
const Streamer: React.FC<{ x: number; top: number; len: number; h: number; name: string; color: string }> = ({ x, top, len, h, name, color }) => {
  const d = `M ${x + 2} ${top} C ${x + len * 0.35} ${top - h * 0.5} ${x + len * 0.65} ${top + h * 0.6} ${x + len} ${top + h * 0.3} L ${x + len * 0.96} ${top + h * 0.62} C ${x + len * 0.65} ${top + h * 1.3} ${x + len * 0.35} ${top + h * 0.6} ${x + 2} ${top + h * 1.1} Z`;
  const size = h * 0.62;
  return (
    <g>
      <path d={d} fill={color} />
      <text x={x + len * 0.42} y={top + h * 0.56} dy="0.35em" textAnchor="middle" fontSize={size} fontWeight={800} fill="#1d2a33" fontFamily={FONT} {...fit(name, size, len * 0.7)}>
        {name}
      </text>
    </g>
  );
};

// Squeezes text into `max` units when it would be wider.
const fit = (text: string, size: number, max: number) => (text.length * size * 0.58 > max ? { textLength: max, lengthAdjust: "spacingAndGlyphs" as const } : {});

// The donor's name painted on the hull side.
const HullName: React.FC<{ name: string; y: number; size: number; max: number; x?: number }> = ({ name, y, size, max, x = 0 }) => (
  <text x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={size * 0.08} fill={SAIL} fontFamily={FONT} {...fit(name.toUpperCase(), size, max)}>
    {name.toUpperCase()}
  </text>
);

// A brass porthole with the avatar.
const Porthole: React.FC<{ cx: number; cy: number; r: number; image?: string; name: string; uid: string }> = (p) => (
  <Avatar {...p} ring={BRASS} ringWidth={p.r * 0.22} uid={`port-${p.uid}`} />
);

// ---------------------------------------------------------------------------------------
// A small sailing boat (dinghy, sloop, brigantine): its hull, masts and sails, and the
// identity pieces asked for.

type Mast = { x: number; h: number; sail?: { type: keyof typeof sails; w: number; printed?: boolean; logo?: boolean }; square?: { hw: number; top: number; bottom: number }[]; flag?: boolean; streamer?: boolean };
type BoatDef = {
  kind: Exclude<BoatKind, "galleon">;
  masts: Mast[];
  jibs?: number; // headsails on the forestay (0, 1 or 2)
  spinnaker?: boolean;
  hullName?: boolean;
  porthole?: boolean;
};

const Sailboat: React.FC<VariantProps & { def: BoatDef }> = ({ def, image, name, uid, color }) => {
  const { L, F } = RIG[def.kind];
  const deck = -F;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const fore = [...def.masts].sort((a, b) => b.x - a.x)[0];
  const sprit = { x: bow.x + L * 0.16, y: bow.y - 4 };
  const id = { image, name, uid };
  return (
    <g>
      {/* Masts and rigging */}
      {def.masts.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 2.5 - L / 200} y={deck - m.h} width={5 + L / 100} height={m.h} rx={2} fill={WOOD_DARK} />
          <line x1={m.x} y1={deck - m.h} x2={-L / 2 + 4} y2={deck} stroke={ROPE} strokeWidth={1.2} opacity={0.6} />
          {!m.flag && !m.streamer && <path d={`M ${m.x + 2} ${deck - m.h} L ${m.x + 2 + Math.max(20, L * 0.12)} ${deck - m.h + 6} L ${m.x + 2} ${deck - m.h + 13} Z`} fill={color} />}
        </g>
      ))}
      <line x1={fore.x} y1={deck - fore.h} x2={def.spinnaker ? sprit.x : bow.x} y2={def.spinnaker ? sprit.y : bow.y} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      {def.spinnaker && <line x1={bow.x - 6} y1={bow.y + 2} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={4} strokeLinecap="round" />}
      {/* Sails */}
      {def.masts.map((m, i) => {
        const top = deck - m.h + 8;
        const foot = deck - 12;
        return (
          <g key={i}>
            {m.square?.map((s, j) => (
              <g key={j}>
                <path d={square(m.x, s.top, s.bottom, s.hw)} fill={SAIL} />
                <path d={`M ${m.x} ${s.top} L ${m.x + s.hw} ${s.top} Q ${m.x + s.hw * 1.1} ${(s.top + s.bottom) / 2} ${m.x + s.hw * 0.94} ${s.bottom} Q ${m.x + s.hw * 0.5} ${s.bottom + 8} ${m.x} ${s.bottom + 10} Z`} fill={SHADE} />
                <rect x={m.x - s.hw - 6} y={s.top - 3} width={s.hw * 2 + 12} height={5} rx={2.5} fill={WOOD_DARK} />
              </g>
            ))}
            {m.sail &&
              (() => {
                const s = sails[m.sail.type](m.x - 3, top, foot, m.sail.w);
                return (
                  <g>
                    <FASail s={s} printed={m.sail.printed ? { ...id, uid: `${uid}-${i}` } : undefined} />
                    <rect x={m.x - 3 - m.sail.w - 3} y={foot} width={m.sail.w + 3} height={3.5} rx={1.5} fill={WOOD_DARK} />
                    {m.sail.logo && <Avatar {...s.spot} r={s.spot.r * 0.95} ring={color} ringWidth={Math.max(2.5, s.spot.r * 0.08)} image={image} name={name} uid={`logo-${uid}-${i}`} />}
                  </g>
                );
              })()}
          </g>
        );
      })}
      {/* Headsails */}
      {Array.from({ length: def.jibs ?? 0 }, (_, k) => (
        <path key={k} d={jib(fore.x, deck - fore.h + 22 + k * fore.h * 0.28, bow.x - 8 - k * L * 0.1, bow.y - 4, deck - 14)} fill={k === 0 ? SHADE : SAIL} />
      ))}
      {def.spinnaker && <Spinnaker mx={fore.x} top={deck - fore.h} deck={deck} tackX={sprit.x} {...id} ring={color} />}
      {/* Hull */}
      <PlankHull d={hullFor(def.kind, plan(def.kind))} uid={`v-${uid}`} L={L} F={F} wood="#a9744f" line="#8a5b3b" dark={WOOD_DARK} />
      {def.hullName && <HullName name={name} y={-F * 0.5} size={Math.max(9, F * 0.5)} max={L * 0.66} x={def.porthole ? -L * 0.08 : 0} />}
      {def.porthole && <Porthole cx={def.hullName ? L * 0.32 : L * 0.05} cy={-F * 0.48} r={Math.max(9, F * 0.42)} {...id} />}
      {/* Masthead identity */}
      {def.masts.map((m, i) =>
        m.flag ? (
          <Flag key={i} x={m.x} top={deck - m.h} w={Math.max(40, L * 0.24)} {...id} uid={`${uid}-${i}`} />
        ) : m.streamer ? (
          <Streamer key={i} x={m.x} top={deck - m.h} len={Math.max(100, L * 0.8)} h={Math.max(16, L * 0.08)} name={name} color={color} />
        ) : null,
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// The galleon (enterprise sponsors): the site's galleon, with the sponsor shown in five ways.

type GalleonDef = {
  logoCourse?: boolean; // big logo on the main course
  printed?: ("main" | "fore")[]; // courses printed with the logo
  sternFlag?: boolean; // a big ensign at the stern with the logo
  banner?: boolean; // a name banner hung between the main and fore masts
  castleName?: boolean; // the name on the stern castle
  hullName?: boolean; // the name along the hull
  mastFlags?: boolean; // flags with the logo on every masthead
  streamer?: boolean; // a streamer with the name from the mainmast
};

const Galleon: React.FC<VariantProps & { def: GalleonDef }> = ({ def, image, name, uid, color }) => {
  const p = plan("galleon");
  const { L, F } = RIG.galleon;
  const deck = p.deck;
  const c = p.castle!;
  const main = p.sq[0];
  const fore = p.sq[1];
  const mizzen = p.fa[0];
  const id = { image, name, uid };
  const course = (m: typeof main, which: "main" | "fore") => {
    const s = m.sails[1];
    const d = square(m.x, s.top, s.bottom, s.hw);
    if (!def.printed?.includes(which)) return null;
    return (
      <g>
        <defs>
          <clipPath id={`gprint-${uid}-${which}`}>
            <path d={d} />
          </clipPath>
        </defs>
        {image && <image href={image} x={m.x - s.hw} y={s.top} width={s.hw * 2} height={s.bottom - s.top + 12} clipPath={`url(#gprint-${uid}-${which})`} preserveAspectRatio="xMidYMid slice" />}
        <path d={d} fill="none" stroke={SAIL} strokeWidth={4} />
      </g>
    );
  };
  const mainCourse = main.sails[1];
  return (
    <g>
      {/* Masts */}
      {[
        { x: mizzen.x, h: mizzen.h, base: mizzen.base! },
        { x: main.x, h: main.h, base: deck },
        { x: fore.x, h: fore.h, base: deck },
      ].map((m, i) => (
        <g key={i}>
          <rect x={m.x - 4} y={m.base - m.h} width={8} height={m.h} rx={3} fill={WOOD_DARK} />
          {!def.mastFlags && !(def.streamer && i === 1) && <path d={`M ${m.x + 3} ${m.base - m.h} L ${m.x + 73} ${m.base - m.h + 9} L ${m.x + 3} ${m.base - m.h + 18} Z`} fill={color} />}
        </g>
      ))}
      <line x1={232} y1={deck - 16} x2={312} y2={deck - 64} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
      <line x1={fore.x} y1={deck - fore.h} x2={312} y2={deck - 64} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      <line x1={main.x} y1={deck - main.h} x2={fore.x} y2={deck - fore.h + 30} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      {/* Sails */}
      <path d={triangle(mizzen.x + 4, mizzen.base! - mizzen.h + 20, mizzen.base! - 26, 80)} fill={SHADE} />
      <path d={`M ${fore.x + 8} ${deck - fore.h + 40} L ${304} ${deck - 62} L ${fore.x + 30} ${deck - 40} Z`} fill={SHADE} />
      {[main, fore].map((m, i) =>
        m.sails.map((s, j) => (
          <g key={`${i}-${j}`}>
            <path d={square(m.x, s.top, s.bottom, s.hw)} fill={SAIL} />
            <path d={`M ${m.x} ${s.top} L ${m.x + s.hw} ${s.top} Q ${m.x + s.hw * 1.1} ${(s.top + s.bottom) / 2} ${m.x + s.hw * 0.94} ${s.bottom} Q ${m.x + s.hw * 0.5} ${s.bottom + 8} ${m.x} ${s.bottom + 10} Z`} fill={SHADE} />
            <rect x={m.x - s.hw - 8} y={s.top - 4} width={s.hw * 2 + 16} height={6} rx={3} fill={WOOD_DARK} />
          </g>
        )),
      )}
      {course(main, "main")}
      {course(fore, "fore")}
      {def.logoCourse && (
        <Avatar cx={main.x} cy={(mainCourse.top + mainCourse.bottom) / 2 + 4} r={50} ring={color} ringWidth={5} image={image} name={name} uid={`gl-${uid}`} />
      )}
      {/* Name banner hung between the main and fore masts */}
      {def.banner && (
        <g>
          <path d={`M ${main.x + 6} ${deck - 300} Q ${(main.x + fore.x) / 2} ${deck - 278} ${fore.x - 6} ${deck - 262} L ${fore.x - 8} ${deck - 228} Q ${(main.x + fore.x) / 2} ${deck - 240} ${main.x + 6} ${deck - 262} Z`} fill={color} />
          <text x={(main.x + fore.x) / 2} y={deck - 262} dy="0.36em" textAnchor="middle" fontSize={20} fontWeight={800} fill="#1d2a33" fontFamily={FONT} transform={`rotate(9 ${(main.x + fore.x) / 2} ${deck - 262})`} {...fit(name.toUpperCase(), 20, 120)}>
            {name.toUpperCase()}
          </text>
        </g>
      )}
      {/* Hull */}
      <PlankHull d={hullFor("galleon", p)} uid={`vg-${uid}`} L={L} F={F} wood="#a9744f" line="#8a5b3b" dark={WOOD_DARK} />
      <g>
        <defs>
          <clipPath id={`gband-${uid}`}>
            <path d={hullFor("galleon", p)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#gband-${uid})`}>
          <rect x={-260} y={deck + 8} width={520} height={7} fill="#e0b44f" />
          {!def.hullName && Array.from({ length: 8 }, (_, k) => <rect key={k} x={-96 + k * 38} y={deck + 26} width={16} height={14} rx={2} fill="#2a1a10" />)}
        </g>
      </g>
      {!def.castleName && [0, 1, 2].map((k) => <rect key={k} x={c.x0 + 18 + k * 34} y={deck - c.h + 14} width={20} height={22} rx={6} fill="#ffd66b" />)}
      {def.castleName && <HullName name={name} x={(c.x0 + c.x1) / 2} y={deck - c.h / 2} size={18} max={c.x1 - c.x0 - 20} />}
      {def.hullName && <HullName name={name} x={60} y={deck + 34} size={22} max={300} />}
      {/* Stern ensign */}
      {def.sternFlag && (
        <g>
          <rect x={c.x0 + 4} y={deck - c.h - 120} width={5} height={120} fill={WOOD_DARK} />
          <path d={`M ${c.x0 + 2} ${deck - c.h - 118} Q ${c.x0 - 60} ${deck - c.h - 128} ${c.x0 - 120} ${deck - c.h - 112} L ${c.x0 - 120} ${deck - c.h - 36} Q ${c.x0 - 60} ${deck - c.h - 52} ${c.x0 + 2} ${deck - c.h - 42} Z`} fill={SAIL} />
          <defs>
            <clipPath id={`ensign-${uid}`}>
              <path d={`M ${c.x0 - 4} ${deck - c.h - 112} L ${c.x0 - 114} ${deck - c.h - 106} L ${c.x0 - 114} ${deck - c.h - 44} L ${c.x0 - 4} ${deck - c.h - 48} Z`} />
            </clipPath>
          </defs>
          {image && <image href={image} x={c.x0 - 114} y={deck - c.h - 112} width={110} height={68} clipPath={`url(#ensign-${uid})`} preserveAspectRatio="xMidYMid slice" />}
        </g>
      )}
      {/* Masthead flags and streamer */}
      {def.mastFlags &&
        [
          { x: mizzen.x, top: mizzen.base! - mizzen.h },
          { x: main.x, top: deck - main.h },
          { x: fore.x, top: deck - fore.h },
        ].map((m, i) => <Flag key={i} x={m.x} top={m.top} w={i === 1 ? 84 : 64} {...id} uid={`${uid}-gf${i}`} />)}
      {def.streamer && <Streamer x={main.x} top={deck - main.h} len={260} h={26} name={name} color={color} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// The variants, five per boat type.

const sb = (def: BoatDef): React.FC<VariantProps> => (props) => <Sailboat {...props} def={def} />;
const gl = (def: GalleonDef): React.FC<VariantProps> => (props) => <Galleon {...props} def={def} />;

export const VARIANTS: Record<BoatKind, Variant[]> = {
  dinghy: [
    { id: "d1", label: "Cat rig · big logo on the sail · name on the hull", Boat: sb({ kind: "dinghy", masts: [{ x: 8, h: 140, sail: { type: "triangle", w: 66, logo: true } }], hullName: true }) },
    { id: "d2", label: "Lug sail printed with the picture", Boat: sb({ kind: "dinghy", masts: [{ x: 10, h: 130, sail: { type: "lug", w: 80, printed: true } }] }) },
    { id: "d3", label: "Sprit sail · masthead flag · name on the hull", Boat: sb({ kind: "dinghy", masts: [{ x: 8, h: 150, sail: { type: "sprit", w: 70 }, flag: true }], hullName: true }) },
    { id: "d4", label: "Cat rig with a spinnaker carrying the logo", Boat: sb({ kind: "dinghy", masts: [{ x: -4, h: 150, sail: { type: "triangle", w: 58 } }], spinnaker: true }) },
    { id: "d5", label: "Gaff rig · name streamer · porthole", Boat: sb({ kind: "dinghy", masts: [{ x: 8, h: 140, sail: { type: "gaff", w: 66 }, streamer: true }], porthole: true }) },
  ],
  sloop: [
    { id: "s1", label: "Bermuda sloop · big logo on the main · name on the hull", Boat: sb({ kind: "sloop", masts: [{ x: 0, h: 220, sail: { type: "triangle", w: 90, logo: true } }], jibs: 1, hullName: true }) },
    { id: "s2", label: "Gaff sloop · main printed with the picture", Boat: sb({ kind: "sloop", masts: [{ x: 4, h: 210, sail: { type: "gaff", w: 100, printed: true } }], jibs: 1 }) },
    { id: "s3", label: "Sloop with a logo spinnaker", Boat: sb({ kind: "sloop", masts: [{ x: -10, h: 230, sail: { type: "triangle", w: 86 } }], spinnaker: true, hullName: true }) },
    { id: "s4", label: "Cutter (two jibs) · masthead flag · name on the hull", Boat: sb({ kind: "sloop", masts: [{ x: -6, h: 225, sail: { type: "triangle", w: 88 }, flag: true }], jibs: 2, hullName: true }) },
    { id: "s5", label: "Bermuda sloop · name streamer · porthole", Boat: sb({ kind: "sloop", masts: [{ x: 0, h: 220, sail: { type: "triangle", w: 90 }, streamer: true }], jibs: 1, porthole: true }) },
  ],
  brig: [
    { id: "b1", label: "Two-master · big logo on the main · name on the hull", Boat: sb({ kind: "brig", masts: [{ x: -55, h: 290, sail: { type: "triangle", w: 120, logo: true } }, { x: 60, h: 230, sail: { type: "triangle", w: 100 } }], jibs: 1, hullName: true }) },
    {
      id: "b2",
      label: "Brigantine (square fore) · gaff main printed",
      Boat: sb({
        kind: "brig",
        masts: [
          { x: -60, h: 262, sail: { type: "gaff", w: 118, printed: true } },
          {
            x: 72,
            h: 240,
            square: [
              { hw: 46, top: -40 - 228, bottom: -40 - 140 },
              { hw: 56, top: -40 - 128, bottom: -40 - 30 },
            ],
          },
        ],
        jibs: 1,
      }),
    },
    { id: "b3", label: "Schooner (two gaffs) · masthead flag · name on the hull", Boat: sb({ kind: "brig", masts: [{ x: -50, h: 280, sail: { type: "gaff", w: 112 }, flag: true }, { x: 70, h: 240, sail: { type: "gaff", w: 104 } }], jibs: 1, hullName: true }) },
    { id: "b4", label: "Ketch with a logo spinnaker", Boat: sb({ kind: "brig", masts: [{ x: -100, h: 190, sail: { type: "triangle", w: 70 } }, { x: 10, h: 290, sail: { type: "triangle", w: 100 } }], spinnaker: true, hullName: true }) },
    {
      id: "b5",
      label: "Brigantine · name streamer · porthole",
      Boat: sb({
        kind: "brig",
        masts: [
          { x: -60, h: 262, sail: { type: "gaff", w: 118 }, streamer: true },
          {
            x: 72,
            h: 240,
            square: [
              { hw: 46, top: -40 - 228, bottom: -40 - 140 },
              { hw: 56, top: -40 - 128, bottom: -40 - 30 },
            ],
          },
        ],
        jibs: 1,
        porthole: true,
      }),
    },
  ],
  galleon: [
    { id: "g1", label: "Big logo on the main course · name on the stern castle", Boat: gl({ logoCourse: true, castleName: true }) },
    { id: "g2", label: "Main and fore courses printed with the logo", Boat: gl({ printed: ["main", "fore"], hullName: true }) },
    { id: "g3", label: "A big ensign at the stern · name on the hull", Boat: gl({ sternFlag: true, hullName: true, logoCourse: true }) },
    { id: "g4", label: "Name banner between the masts · logo on the main course", Boat: gl({ banner: true, logoCourse: true, castleName: true }) },
    { id: "g5", label: "Logo flags on every mast · name streamer", Boat: gl({ mastFlags: true, streamer: true, hullName: true }) },
  ],
};
