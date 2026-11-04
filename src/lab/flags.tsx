import React from "react";
import type { BoatKind } from "../members";
import { ClothBoat, MASTS } from "./cloth";
import { RIG, plan } from "./proposals";

// Proposals with the donor's name on the hull and their logo on flags, on the site's boats
// with plain sails. Flags stream aft (to the left), as they do on a boat under way. Five
// treatments per boat, and the fallback for a donor without a logo.

export type FlagMode = "masthead" | "ensign" | "burgee" | "dressed" | "pair" | "nologo";
export type FlagProps = { kind: BoatKind; mode: FlagMode; image?: string; name: string; uid: string; color: string };

const CREAM = "#f4f1ea";
const WOOD_DARK = "#5a3522";
const ROPE = "#3b2b20";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";
const SIGNALS = ["#e8573f", "#f9c46b", "#006888", "#f4f1ea", "#a6e3a1", "#cba6f7"];

type Shape = "rect" | "swallow" | "pennant";

// A waving flag hoisted at (x, y) and flying to the left, `w` long and `h` high. Shows the
// logo whole (never cropped) on cream, or a text, or just its colour.
const Flag: React.FC<{ x: number; y: number; w: number; h: number; shape?: Shape; fill?: string; image?: string; text?: string; uid: string }> = ({
  x,
  y,
  w,
  h,
  shape = "rect",
  fill = CREAM,
  image,
  text,
  uid,
}) => {
  const a = h * 0.09;
  const fly = x - w;
  const top = `M ${x} ${y} C ${x - w * 0.33} ${y - a} ${x - w * 0.66} ${y + a} ${fly} ${y}`;
  const end =
    shape === "swallow"
      ? ` L ${x - w * 0.8} ${y + h / 2} L ${fly} ${y + h}`
      : shape === "pennant"
        ? ` L ${fly} ${y + h / 2}`
        : ` L ${fly} ${y + h}`;
  const bottom =
    shape === "pennant"
      ? ` L ${x} ${y + h} Z`
      : ` C ${x - w * 0.66} ${y + h + a} ${x - w * 0.33} ${y + h - a} ${x} ${y + h} Z`;
  const d = shape === "pennant" ? `M ${x} ${y} L ${fly} ${y + h / 2}${bottom}` : top + end + bottom;
  // Where the logo sits: the flag's body, inset (short of a swallowtail's notch).
  // The cloth: the logo covers the whole flag (cream shows through transparent parts).
  const body = { x: fly, y: y - a, w, h: h + a * 2 };
  return (
    <g>
      <defs>
        <clipPath id={`flag-${uid}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={fill} />
      <g clipPath={`url(#flag-${uid})`}>
        {image && <image href={image} x={body.x} y={body.y} width={body.w} height={body.h} preserveAspectRatio="xMidYMid slice" />}
        {text && (
          <text
            x={x - w * 0.52}
            y={y + h / 2}
            dy="0.36em"
            textAnchor="middle"
            fontSize={h * 0.42}
            fontWeight={800}
            fill={CREAM}
            fontFamily={FONT}
            {...(text.length * h * 0.42 * 0.62 > w * 0.78 ? { textLength: w * 0.78, lengthAdjust: "spacingAndGlyphs" as const } : {})}
          >
            {text}
          </text>
        )}
        {/* Folds in the cloth (dark in the troughs, light on the crests), and the hem along the pole */}
        <rect x={x - w * 0.62} y={y - a} width={w * 0.14} height={h + a * 2} fill="#000" opacity={0.12} />
        <rect x={x - w * 0.95} y={y - a} width={w * 0.1} height={h + a * 2} fill="#000" opacity={0.08} />
        <rect x={x - w * 0.3} y={y - a} width={w * 0.1} height={h + a * 2} fill="#fff" opacity={0.12} />
        <rect x={x - w * 0.06} y={y - a} width={w * 0.06} height={h + a * 2} fill="#e3dccb" />
      </g>
    </g>
  );
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// A line of small signal flags along a rope from `a` to `b`.
const SignalLine: React.FC<{ a: [number, number]; b: [number, number]; n: number; size: number; offset?: number }> = ({ a, b, n, size, offset = 0 }) => (
  <g>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ROPE} strokeWidth={1} opacity={0.7} />
    {Array.from({ length: n }, (_, k) => {
      const t = (k + 0.5) / n;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const c = SIGNALS[(k + offset) % SIGNALS.length];
      return k % 2 === 0 ? (
        <rect key={k} x={x - size / 2} y={y} width={size} height={size * 0.9} fill={c} />
      ) : (
        <path key={k} d={`M ${x - size / 2} ${y} L ${x + size / 2} ${y} L ${x} ${y + size * 1.1} Z`} fill={c} />
      );
    })}
  </g>
);

// A pole on top of a mast, so a masthead flag clears the sail's head.
const Pole: React.FC<{ x: number; top: number; h: number; wide: number }> = ({ x, top, h, wide }) => <rect x={x - wide / 2} y={top - h} width={wide} height={h + 2} rx={1} fill={WOOD_DARK} />;

// ---------------------------------------------------------------------------------------

const SmallBoatFlags: React.FC<FlagProps & { kind: Exclude<BoatKind, "galleon"> }> = ({ kind, mode, image, name, uid, color }) => {
  const { L, F } = RIG[kind];
  const deck = -F;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const main = MASTS[kind][0];
  const foreMast = MASTS[kind][MASTS[kind].length - 1];
  const mainTop = deck - main.h;
  const fw = L * 0.38;
  const fh = fw * 0.9;
  const pole = fh + 6;
  const hoist = mainTop - pole;
  // The stern staff, leaning back a little.
  const staff = { x0: -L / 2 + 8, y0: deck, x1: -L / 2 - 4, y1: deck - L * 0.36 };
  const ensign = { w: L * 0.36, h: L * 0.32 };
  return (
    <g>
      {mode === "dressed" && (
        <g>
          {/* Bow to the foremast's top, mast to mast, then down to the stern */}
          <SignalLine a={[bow.x, bow.y]} b={[foreMast.x, deck - foreMast.h]} n={kind === "dinghy" ? 5 : 8} size={Math.max(6, L * 0.035)} />
          {foreMast !== main && <SignalLine a={[foreMast.x, deck - foreMast.h]} b={[main.x, mainTop]} n={4} size={Math.max(6, L * 0.035)} offset={2} />}
          <SignalLine a={[main.x, mainTop]} b={[-L / 2 + 6, deck]} n={kind === "dinghy" ? 5 : 8} size={Math.max(6, L * 0.035)} offset={3} />
        </g>
      )}
      <ClothBoat kind={kind} mode="plain" name={name} uid={uid} color={color} pennants={false} />
      {(mode === "masthead" || mode === "dressed" || mode === "pair" || mode === "nologo" || mode === "burgee") && <Pole x={main.x} top={mainTop} h={pole} wide={Math.max(2.5, L * 0.012)} />}
      {(mode === "masthead" || mode === "dressed" || mode === "pair") && <Flag x={main.x - 1} y={hoist} w={fw} h={fh} image={image} uid={`${uid}-mh`} />}
      {mode === "burgee" && <Flag x={main.x - 1} y={hoist} w={fw * 1.2} h={fh} shape="swallow" image={image} uid={`${uid}-bg`} />}
      {mode === "nologo" && <Flag x={main.x - 1} y={hoist} w={fw} h={fh} fill={color} text={initials(name)} uid={`${uid}-nl`} />}
      {(mode === "ensign" || mode === "pair") && (
        <g>
          <line x1={staff.x0} y1={staff.y0} x2={staff.x1} y2={staff.y1} stroke={WOOD_DARK} strokeWidth={Math.max(2.5, L * 0.014)} strokeLinecap="round" />
          {mode === "ensign" ? (
            <Flag x={staff.x1} y={staff.y1} w={ensign.w} h={ensign.h} image={image} uid={`${uid}-en`} />
          ) : (
            <Flag x={staff.x1} y={staff.y1} w={ensign.w} h={ensign.h * 0.8} fill={color} text={name.split(/\s+/)[0].toUpperCase().slice(0, 9)} uid={`${uid}-en`} />
          )}
        </g>
      )}
    </g>
  );
};

const GalleonFlags: React.FC<FlagProps> = ({ mode, image, name, uid, color }) => {
  const p = plan("galleon");
  const deck = p.deck;
  const c = p.castle!;
  const [main, fore] = p.sq;
  const mizzen = p.fa[0];
  const tops = [
    { x: mizzen.x, top: mizzen.base! - mizzen.h },
    { x: main.x, top: deck - main.h },
    { x: fore.x, top: deck - fore.h },
  ];
  const sprit = { x: 312, y: deck - 64 };
  const staff = { x0: c.x0 + 6, y0: deck - c.h, x1: c.x0 - 10, y1: deck - c.h - 150 };
  const big = { w: 112, h: 100 };
  return (
    <g>
      {mode === "dressed" && (
        <g>
          <SignalLine a={[sprit.x, sprit.y]} b={[tops[2].x, tops[2].top]} n={8} size={12} />
          <SignalLine a={[tops[2].x, tops[2].top]} b={[tops[1].x, tops[1].top]} n={6} size={12} offset={2} />
          <SignalLine a={[tops[1].x, tops[1].top]} b={[tops[0].x, tops[0].top]} n={6} size={12} offset={4} />
          <SignalLine a={[tops[0].x, tops[0].top]} b={[c.x0, deck - c.h]} n={6} size={12} offset={1} />
        </g>
      )}
      <ClothBoat kind="galleon" mode="plain" name={name} uid={uid} color={color} pennants={false} />
      {tops.map((t, i) => (
        <Pole key={i} x={t.x} top={t.top} h={i === 1 && mode !== "ensign" ? big.h + 8 : mode === "masthead" ? 70 : 56} wide={6} />
      ))}
      {/* Mastheads: the logo on the main, and per mode on the others */}
      {mode === "burgee" ? (
        <Flag x={main.x - 2} y={tops[1].top - big.h - 8} w={big.w * 1.25} h={big.h} shape="swallow" image={image} uid={`${uid}-gb`} />
      ) : mode === "nologo" ? (
        <Flag x={main.x - 2} y={tops[1].top - big.h - 8} w={big.w} h={big.h} fill={color} text={initials(name)} uid={`${uid}-gn`} />
      ) : mode !== "ensign" ? (
        <Flag x={main.x - 2} y={tops[1].top - big.h - 8} w={big.w} h={big.h} image={image} uid={`${uid}-gm`} />
      ) : (
        <Flag x={main.x - 2} y={tops[1].top - 54} w={80} h={32} shape="pennant" fill={color} uid={`${uid}-gmp`} />
      )}
      {[0, 2].map((i) =>
        mode === "masthead" ? (
          <Flag key={i} x={tops[i].x - 2} y={tops[i].top - 66} w={70} h={62} image={image} uid={`${uid}-g${i}`} />
        ) : (
          <Flag key={i} x={tops[i].x - 2} y={tops[i].top - 54} w={70} h={30} shape="pennant" fill={color} uid={`${uid}-gp${i}`} />
        ),
      )}
      {(mode === "ensign" || mode === "pair") && (
        <g>
          <line x1={staff.x0} y1={staff.y0} x2={staff.x1} y2={staff.y1} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
          {mode === "ensign" ? (
            <Flag x={staff.x1} y={staff.y1} w={168} h={150} image={image} uid={`${uid}-ge`} />
          ) : (
            <Flag x={staff.x1} y={staff.y1} w={170} h={70} fill={color} text={name.toUpperCase()} uid={`${uid}-ge`} />
          )}
        </g>
      )}
    </g>
  );
};

export const FlagBoat: React.FC<FlagProps> = (props) => (props.kind === "galleon" ? <GalleonFlags {...props} /> : <SmallBoatFlags {...props} kind={props.kind} />);

export const FLAG_MODES: { mode: FlagMode; label: string }[] = [
  { mode: "masthead", label: "Masthead flag with the logo (galleon: on every mast)" },
  { mode: "ensign", label: "Stern ensign with the logo" },
  { mode: "burgee", label: "Swallowtail burgee with the logo" },
  { mode: "dressed", label: "Dressed with signal flags, the logo at the masthead" },
  { mode: "pair", label: "Logo at the masthead, name on a stern ensign" },
  { mode: "nologo", label: "No logo: a flag in the boat's colour with initials" },
];
