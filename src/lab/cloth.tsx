import React from "react";
import type { BoatKind } from "../members";
import { PlankHull, RIG, hullFor, inTriangle, plan, square, triangle, triangleShade } from "./proposals";

// Proposals with the donor's name on the hull and their logo as sail cloth, on the site's
// boats (same rigs, wood and cream). Five cloth treatments per boat, and the fallback for a
// donor without a logo (plain sails, just the name). Waterline at y 0, bow to the right.

export type ClothMode = "plain" | "fill" | "canvas" | "patch" | "pattern" | "spinnaker";
// `pennants: false` leaves the mastheads bare (for flags drawn over the boat).
export type ClothProps = { kind: BoatKind; mode: ClothMode; image?: string; name: string; uid: string; color: string; pennants?: boolean };

const SAIL = "#f4f1ea";
const SHADE = "#dcd5c4";
const WOOD_DARK = "#5a3522";
const ROPE = "#3b2b20";
const GOLD = "#e0b44f";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";

type Box = { x: number; y: number; w: number; h: number };
type Spot = { cx: number; cy: number; r: number };

// A sail's cloth: plain two-tone canvas, or the logo on it.
//  fill     the logo covers the whole sail, with fold shading so it reads as canvas;
//  canvas   the logo printed whole (never cropped) in the middle of the cream sail;
//  patch    the logo on a stitched patch sewn onto the sail;
//  pattern  the logo repeated across the sail like a branded fabric.
// `area` (optional) is where a whole logo goes on the sail (canvas, patch); by default a
// square around the sail's widest spot.
const Cloth: React.FC<{ d: string; shade?: string; box: Box; spot: Spot; area?: Box; mode: Exclude<ClothMode, "spinnaker">; image?: string; uid: string }> = ({
  d,
  shade,
  box,
  spot,
  area: areaIn,
  mode,
  image,
  uid,
}) => {
  const area = areaIn ?? { x: spot.cx - spot.r * 1.5, y: spot.cy - spot.r * 1.5, w: spot.r * 3, h: spot.r * 3 };
  const inset = (b: Box, k: number) => ({ x: b.x + (b.w * (1 - k)) / 2, y: b.y + (b.h * (1 - k)) / 2, w: b.w * k, h: b.h * k });
  const clip = `cloth-${uid}`;
  const logo = image && mode !== "plain";
  const folds = Array.from({ length: 5 }, (_, k) => box.x + (box.w * (k + 0.5)) / 5);
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
        {mode === "pattern" && image && (
          <pattern id={`pat-${uid}`} patternUnits="userSpaceOnUse" x={box.x} y={box.y} width={spot.r * 1.2} height={spot.r * 1.2}>
            <image href={image} x={spot.r * 0.12} y={spot.r * 0.12} width={spot.r * 0.96} height={spot.r * 0.96} preserveAspectRatio="xMidYMid meet" />
          </pattern>
        )}
      </defs>
      <path d={d} fill={SAIL} />
      {shade && (!logo || mode === "canvas" || mode === "patch") && <path d={shade} fill={SHADE} />}
      {logo && (
        <g clipPath={`url(#${clip})`}>
          {mode === "fill" && <image href={image} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid slice" />}
          {mode === "canvas" && <image href={image} {...area} width={area.w} height={area.h} preserveAspectRatio="xMidYMid meet" />}
          {mode === "pattern" && <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`url(#pat-${uid})`} />}
          {mode === "patch" &&
            (() => {
              const pb = inset(area, areaIn ? 0.9 : 0.72);
              const st = Math.min(pb.w, pb.h);
              const inner = inset(pb, 0.86);
              return (
                <g>
                  <rect {...pb} width={pb.w} height={pb.h} rx={st * 0.06} fill="#ffffff" />
                  <image href={image} {...inset(inner, 0.92)} width={inner.w * 0.92} height={inner.h * 0.92} preserveAspectRatio="xMidYMid meet" />
                  <rect {...inner} width={inner.w} height={inner.h} rx={st * 0.04} fill="none" stroke="#8a7f6a" strokeWidth={Math.max(1, st * 0.02)} strokeDasharray={`${st * 0.05} ${st * 0.04}`} />
                </g>
              );
            })()}
          {/* Folds in the canvas, so a print reads as cloth */}
          {(mode === "fill" || mode === "pattern") && folds.map((x, k) => <rect key={k} x={x} y={box.y} width={box.w / 10} height={box.h} fill="#000" opacity={0.06} />)}
        </g>
      )}
      {shade && logo && (mode === "fill" || mode === "pattern") && <path d={shade} fill="#000" opacity={0.1} />}
      {logo && mode !== "canvas" && mode !== "patch" && <path d={d} fill="none" stroke={SAIL} strokeWidth={Math.max(2, box.w * 0.025)} />}
    </g>
  );
};

// The donor's name painted along the hull, squeezed to fit if long.
const HullName: React.FC<{ name: string; x: number; y: number; size: number; max: number }> = ({ name, x, y, size, max }) => {
  const text = name.toUpperCase();
  const squeeze = text.length * size * 0.62 > max ? { textLength: max, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <text x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={size * 0.06} fill={SAIL} fontFamily={FONT} {...squeeze}>
      {text}
    </text>
  );
};
const NAME_SIZE: Record<BoatKind, number> = { dinghy: 12, sloop: 15, brig: 19, galleon: 24 };

// A balloon spinnaker ahead of the mast, flying to the end of a bowsprit, printed with the
// logo (whole, in its middle).
const spinnaker = (mx: number, top: number, deck: number, tackX: number) => {
  const span = tackX - mx;
  return {
    d: `M ${mx + 4} ${top + 6} Q ${tackX + span * 0.55} ${top + (deck - top) * 0.3} ${tackX} ${deck - 8} L ${mx + span * 0.18} ${deck - 14} Q ${mx + span * 0.05} ${(top + deck) / 2} ${mx + 4} ${top + 6} Z`,
    box: { x: mx, y: top, w: span * 1.3, h: deck - top },
    spot: { cx: mx + span * 0.6, cy: top + (deck - top) * 0.5, r: span * 0.36 },
  };
};

// ---------------------------------------------------------------------------------------
// The site's sailing boats (dinghy, sloop, brigantine): triangle main sails, a jib.

export const MASTS: Record<Exclude<BoatKind, "galleon">, { x: number; h: number }[]> = {
  dinghy: [{ x: 4, h: 140 }],
  sloop: [{ x: 0, h: 220 }],
  brig: [
    { x: -55, h: 290 },
    { x: 60, h: 230 },
  ],
};

const Sailboat: React.FC<ClothProps & { kind: Exclude<BoatKind, "galleon"> }> = ({ kind, mode, image, name, uid, color, pennants = true }) => {
  const { L, F } = RIG[kind];
  const deck = -F;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const masts = MASTS[kind];
  const fore = masts[masts.length - 1];
  const spin = mode === "spinnaker";
  const sprit = { x: bow.x + L * 0.16, y: bow.y - 4 };
  const widths = masts.map((m, i) => (i === 0 ? Math.min(L * 0.4, m.x + L / 2 - 6) : m.x - masts[i - 1].x - 12));
  // Which sails carry the logo: the main sail, and in "pattern" every sail.
  const cloth = (i: number): Exclude<ClothMode, "spinnaker"> => (spin ? "plain" : mode === "pattern" ? "pattern" : i === 0 ? mode : "plain");
  const jibTop = deck - fore.h + 22;
  const jibD = `M ${fore.x + 3} ${jibTop} L ${bow.x - L * 0.06} ${bow.y - 6} L ${fore.x + 3} ${deck - 12} Z`;
  const jibBox = { x: fore.x, y: jibTop, w: bow.x - fore.x, h: deck - 12 - jibTop };
  return (
    <g>
      {masts.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 2.5} y={deck - m.h} width={5} height={m.h} rx={2} fill={WOOD_DARK} />
          <line x1={m.x} y1={deck - m.h} x2={-L / 2 + 4} y2={deck} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
          {pennants && <path d={`M ${m.x + 2} ${deck - m.h} L ${m.x + 2 + L * 0.12} ${deck - m.h + 6} L ${m.x + 2} ${deck - m.h + 13} Z`} fill={color} />}
        </g>
      ))}
      <line x1={fore.x} y1={deck - fore.h} x2={spin ? sprit.x : bow.x} y2={spin ? sprit.y : bow.y} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      {spin && <line x1={bow.x - 6} y1={bow.y + 2} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={4} strokeLinecap="round" />}
      {masts.map((m, i) => {
        const top = deck - m.h + 8;
        const foot = deck - 12;
        const x = m.x - 3;
        const w = widths[i];
        return (
          <g key={i}>
            <Cloth d={triangle(x, top, foot, w)} shade={triangleShade(x, top, foot, w)} box={{ x: x - w, y: top, w, h: foot - top }} spot={inTriangle(x, top, foot, w)} mode={cloth(i)} image={image} uid={`${uid}-${i}`} />
            <rect x={x - w - 3} y={foot} width={w + 3} height={3.5} rx={1.5} fill={WOOD_DARK} />
          </g>
        );
      })}
      {kind !== "dinghy" && !spin && (
        <Cloth d={jibD} box={jibBox} spot={{ cx: fore.x + jibBox.w * 0.3, cy: jibTop + jibBox.h * 0.62, r: jibBox.w * 0.16 }} mode={mode === "pattern" ? "pattern" : "plain"} image={image} uid={`${uid}-jib`} />
      )}
      {spin && (() => {
        const s = spinnaker(fore.x, deck - fore.h, deck, sprit.x);
        return <Cloth d={s.d} box={s.box} spot={s.spot} mode="canvas" image={image} uid={`${uid}-spin`} />;
      })()}
      <PlankHull d={hullFor(kind, plan(kind))} uid={`c-${uid}`} L={L} F={F} wood="#a9744f" line="#8a5b3b" dark={WOOD_DARK} />
      <HullName name={name} x={-L * 0.04} y={deck * 0.38} size={NAME_SIZE[kind]} max={L * 0.66} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------
// The galleon (enterprise sponsors): the site's galleon, its square courses as cloth. In
// "spinnaker" (a galleon has none) the logo goes on a spritsail under the bowsprit and on the
// main course, as on period galleons.

const Galleon: React.FC<ClothProps> = ({ mode, image, name, uid, color, pennants = true }) => {
  const p = plan("galleon");
  const { L, F } = RIG.galleon;
  const deck = p.deck;
  const c = p.castle!;
  const [main, fore] = p.sq;
  const mizzen = p.fa[0];
  const sprit = { x: 312, y: deck - 64 };
  // Which courses carry the logo, per mode.
  const printed = (mast: 0 | 1, sail: 0 | 1): Exclude<ClothMode, "spinnaker"> => {
    if (mode === "plain") return "plain";
    if (mode === "pattern") return "pattern";
    if (mode === "fill") return mast === 0 || sail === 1 ? "fill" : "plain";
    if (mode === "spinnaker") return mast === 0 && sail === 1 ? "canvas" : "plain";
    return mast === 0 && sail === 1 ? mode : "plain";
  };
  return (
    <g>
      {[
        { x: mizzen.x, h: mizzen.h, base: mizzen.base! },
        { x: main.x, h: main.h, base: deck },
        { x: fore.x, h: fore.h, base: deck },
      ].map((m, i) => (
        <g key={i}>
          <rect x={m.x - 4} y={m.base - m.h} width={8} height={m.h} rx={3} fill={WOOD_DARK} />
          {pennants && <path d={`M ${m.x + 3} ${m.base - m.h} L ${m.x + 73} ${m.base - m.h + 9} L ${m.x + 3} ${m.base - m.h + 18} Z`} fill={color} />}
        </g>
      ))}
      <line x1={232} y1={deck - 16} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
      <line x1={fore.x} y1={deck - fore.h} x2={sprit.x} y2={sprit.y} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      <line x1={main.x} y1={deck - main.h} x2={fore.x} y2={deck - fore.h + 30} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      <path d={triangle(mizzen.x + 4, mizzen.base! - mizzen.h + 20, mizzen.base! - 26, 80)} fill={SHADE} />
      {mode !== "spinnaker" && <path d={`M ${fore.x + 8} ${deck - fore.h + 40} L ${304} ${deck - 62} L ${fore.x + 30} ${deck - 40} Z`} fill={SHADE} />}
      {[main, fore].map((m, i) =>
        m.sails.map((s, j) => {
          const d = square(m.x, s.top, s.bottom, s.hw);
          const shade = `M ${m.x} ${s.top} L ${m.x + s.hw} ${s.top} Q ${m.x + s.hw * 1.1} ${(s.top + s.bottom) / 2} ${m.x + s.hw * 0.94} ${s.bottom} Q ${m.x + s.hw * 0.5} ${s.bottom + 8} ${m.x} ${s.bottom + 10} Z`;
          const r = Math.min(s.hw, (s.bottom - s.top) / 2) * 0.82;
          return (
            <g key={`${i}-${j}`}>
              <Cloth
                d={d}
                shade={shade}
                box={{ x: m.x - s.hw * 1.1, y: s.top, w: s.hw * 2.2, h: s.bottom - s.top + 12 }}
                spot={{ cx: m.x, cy: (s.top + s.bottom) / 2 + 3, r }}
                area={{ x: m.x - s.hw * 0.86, y: s.top + (s.bottom - s.top) * 0.1, w: s.hw * 1.72, h: (s.bottom - s.top) * 0.86 }}
                mode={printed(i as 0 | 1, j as 0 | 1)}
                image={image}
                uid={`${uid}-g${i}${j}`}
              />
              <rect x={m.x - s.hw - 8} y={s.top - 4} width={s.hw * 2 + 16} height={6} rx={3} fill={WOOD_DARK} />
            </g>
          );
        }),
      )}
      {/* The spritsail under the bowsprit */}
      {mode === "spinnaker" && (
        <g>
          <rect x={sprit.x - 70} y={sprit.y + 14} width={74} height={5} rx={2.5} fill={WOOD_DARK} />
          <Cloth
            d={square(sprit.x - 33, sprit.y + 18, sprit.y + 84, 36)}
            box={{ x: sprit.x - 75, y: sprit.y + 18, w: 84, h: 72 }}
            spot={{ cx: sprit.x - 33, cy: sprit.y + 52, r: 27 }}
            mode="canvas"
            image={image}
            uid={`${uid}-spritsail`}
          />
        </g>
      )}
      <PlankHull d={hullFor("galleon", p)} uid={`cg-${uid}`} L={L} F={F} wood="#a9744f" line="#8a5b3b" dark={WOOD_DARK} />
      <defs>
        <clipPath id={`cgb-${uid}`}>
          <path d={hullFor("galleon", p)} />
        </clipPath>
      </defs>
      <rect x={-260} y={deck + 8} width={520} height={7} fill={GOLD} clipPath={`url(#cgb-${uid})`} />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={c.x0 + 18 + k * 34} y={deck - c.h + 14} width={20} height={22} rx={6} fill="#ffd66b" />
      ))}
      <HullName name={name} x={50} y={deck + 34} size={NAME_SIZE.galleon} max={300} />
    </g>
  );
};

export const ClothBoat: React.FC<ClothProps> = (props) => (props.kind === "galleon" ? <Galleon {...props} /> : <Sailboat {...props} kind={props.kind} />);

export const CLOTH_MODES: { mode: ClothMode; label: string }[] = [
  { mode: "fill", label: "Full print: the logo covers the main sail" },
  { mode: "canvas", label: "Printed on canvas: the whole logo on a cream sail" },
  { mode: "patch", label: "Sewn patch on the sail" },
  { mode: "pattern", label: "Pattern: the logo repeated over every sail" },
  { mode: "spinnaker", label: "Spinnaker printed with the logo (galleon: spritsail)" },
  { mode: "plain", label: "No logo: plain sails, the name on the hull" },
];
