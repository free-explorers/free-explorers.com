import React, { useLayoutEffect, useRef, useState } from "react";
import { boatInfo, type BoatKind, type Member } from "../members";
import { Bob } from "./Motion";

// A member's boat, in the flat style of the teaser's house-boat: a wooden hull, cream sails
// and a pennant in the boat's colour. The member's avatar is painted on the main sail.
// Dinghy, sloop and brigantine are sailing boats of growing size; enterprise sponsors sail a
// galleon (square-rigged, three masts, a stern castle). Drawn with the waterline at y 0,
// centred on x 0, bow to the right, in world units at full scale.

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
  brig: { L: 300, masts: [{ x: -55, h: 290 }, { x: 60, h: 230 }], jib: true },
  sloop: { L: 205, masts: [{ x: 0, h: 220 }], jib: true },
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

const Hull: React.FC<{ L: number }> = ({ L }) => {
  const F = L * 0.14;
  const D = L * 0.1;
  const d = `M ${-L / 2} ${-F} L ${L / 2 + L * 0.05} ${-F * 1.3} Q ${L * 0.42} ${D} ${L * 0.28} ${D} L ${-L * 0.36} ${D} Q ${-L * 0.5} ${D * 0.6} ${-L / 2} ${-F} Z`;
  const id = `hull-${L}`;
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
          <rect key={f} x={-L} y={-F + (F + D) * f} width={L * 2} height={Math.max(1.5, L * 0.012)} fill={WOOD_LINE} />
        ))}
        {/* The shaded bottom, under the waterline */}
        <rect x={-L} y={-1} width={L * 2} height={D * 2} fill={WOOD_DARK} opacity={0.55} />
      </g>
      {/* Gunwale */}
      <path d={`M ${-L / 2 - 2} ${-F} L ${L / 2 + L * 0.05 + 2} ${-F * 1.3}`} stroke={WOOD_DARK} strokeWidth={Math.max(2.5, L * 0.022)} strokeLinecap="round" />
    </g>
  );
};

// A main sail behind a mast, bellied out towards the stern; returns the sail and the circle
// that fits inside it (for the avatar).
// A triangular sail behind a mast (luff on the mast, foot on a boom), and its shaded half.
const triangleSail = (x: number, head: number, foot: number, w: number) =>
  `M ${x} ${head} L ${x} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;
const triangleShade = (x: number, head: number, foot: number, w: number) =>
  `M ${x} ${head} L ${x - w * 0.5} ${foot} L ${x - w} ${foot} Q ${x - w * 0.36} ${(head + foot) / 2 + 6} ${x} ${head} Z`;

const mainSail = (mast: Mast, deck: number, width: number) => {
  const top = deck - mast.h + 8;
  const foot = deck - 12;
  const x = mast.x - 3;
  const d = `M ${x} ${top} L ${x} ${foot} L ${x - width} ${foot} Q ${x - width * 0.38} ${(top + foot) / 2 + 6} ${x} ${top} Z`;
  const a = foot - top;
  const r = (a + width - Math.hypot(a, width)) / 2;
  return { d, foot, width, avatar: { cx: x - r * 0.95, cy: foot - r * 1.05, r: r * 0.78 } };
};

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
      <text x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={size} fontWeight={800} letterSpacing={size * 0.06} fill={SAIL} fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif" {...squeeze}>
        {text}
      </text>
    </g>
  );
};
// Name size on each boat's hull.
const NAME_SIZE: Record<BoatKind, number> = { dinghy: 12, sloop: 15, brig: 19, galleon: 24 };

type ShapeProps = { kind: BoatKind; active?: boolean; image?: string | null; name?: string; uid: string; forSale?: boolean };

export const BoatShape: React.FC<ShapeProps> = (props) => (props.kind === "galleon" ? <Galleon {...props} /> : <Sailboat {...props} />);

const Sailboat: React.FC<ShapeProps> = ({ kind, active = true, image, name = "", uid }) => {
  const { L, masts, jib } = BOAT_SPEC[kind];
  const color = boatInfo(kind).color;
  const deck = -L * 0.14;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const aft = masts[0];
  // Sail widths: the aft mast's sail reaches back over the stern, the fore mast's sail fills
  // the gap between the two masts.
  const sails = masts.map((m, i) => mainSail(m, deck, i === 0 ? Math.min(L * 0.4, m.x + L / 2 - 6) : m.x - masts[i - 1].x - 12));
  const fore = masts[masts.length - 1];
  const avatarAt = active ? sails[0].avatar : { cx: -L * 0.2, cy: deck * 0.5, r: L * 0.055 };
  return (
    <g>
      {/* Masts and rigging */}
      {masts.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 2.5} y={deck - m.h} width={5} height={m.h} rx={2} fill={WOOD_DARK} />
          <line x1={m.x} y1={deck - m.h} x2={-L / 2 + 4} y2={deck} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
          {/* Pennant in the boat's colour */}
          <path d={`M ${m.x + 2} ${deck - m.h} L ${m.x + 2 + L * 0.12} ${deck - m.h + 6} L ${m.x + 2} ${deck - m.h + 13} Z`} fill={color} />
        </g>
      ))}
      <line x1={fore.x} y1={deck - fore.h} x2={bow.x} y2={bow.y} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      {active ? (
        <>
          {sails.map((s, i) => (
            <path key={i} d={s.d} fill={i === 0 ? SAIL : SAIL_SHADE} />
          ))}
          {jib && (
            <path d={`M ${fore.x + 3} ${deck - fore.h + 22} L ${bow.x - L * 0.06} ${bow.y - 6} L ${fore.x + 3} ${deck - 12} Z`} fill={SAIL_SHADE} />
          )}
          {/* Booms */}
          {sails.map((s, i) => (
            <rect key={i} x={masts[i].x - s.width - 3} y={s.foot} width={s.width + 3} height={3.5} rx={1.5} fill={WOOD_DARK} />
          ))}
        </>
      ) : (
        // Former explorers: sails furled along the boom, at rest on the horizon.
        <rect x={aft.x - L * 0.36} y={deck - 18} width={L * 0.36} height={8} rx={4} fill={SAIL_SHADE} />
      )}
      <Hull L={L} />
      {name && <HullName name={name} x={-L * 0.04} y={deck * 0.38} size={NAME_SIZE[kind]} max={L * 0.66} />}
      <Avatar at={avatarAt} color={color} image={image} name={name} uid={uid} />
    </g>
  );
};

// The galleon (enterprise sponsors), sleek: a low stern castle with lit windows, a gold band;
// a main mast with two big square sails, a jib on the bowsprit, a triangular rear sail on the
// mizzen over the castle, pennants in the boat's colour. The sponsor's avatar is on the main
// course, their name along the hull. Former sponsors (and the galleon for sale) have their
// sails furled on the yards.
const GALLEON = { deck: 62, castle: 36, main: { x: -20, h: 340 }, mizzen: { x: -170, h: 190 } };
const GALLEON_SAILS = [
  { top: -GALLEON.deck - 170, bottom: -GALLEON.deck - 34, topHw: 100, bottomHw: 112 },
  { top: -GALLEON.deck - 316, bottom: -GALLEON.deck - 182, topHw: 76, bottomHw: 94 },
];

// The sponsor's logo printed whole across the main course (fitted, never cropped); their name
// painted there if they have no logo, or a "YOUR LOGO" placeholder when there's no sponsor
// yet (the join panel's preview). Kept readable when the galleon sails left (data-cx).
const SailLogo: React.FC<{ sail: string; area: { x: number; y: number; w: number; h: number }; image?: string | null; name: string; uid: string }> = ({ sail, area, image, name, uid }) => {
  const [broken, setBroken] = useState(false);
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const text = name.toUpperCase();
  const size = 30;
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
        ) : name ? (
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
            <rect x={area.x + 10} y={area.y + 10} width={area.w - 20} height={area.h - 20} rx={10} fill="none" stroke={WOOD_LINE} strokeWidth={3} strokeDasharray="10 8" />
            <text x={cx} y={cy} dy="0.36em" textAnchor="middle" fontSize={24} fontWeight={800} fill={WOOD_LINE} fontFamily="Outfit, 'Helvetica Neue', Arial, sans-serif">
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
  const { main, mizzen } = GALLEON;
  const top = D - main.h;
  const mizzenTop = C - mizzen.h;
  const hull = `M -238 ${C} L -118 ${C} L -118 ${D} L 200 ${D} L 246 ${D - 22} Q 205 40 150 44 L -160 44 Q -222 32 -238 ${C} Z`;
  const sprit = { x: 330, y: D - 66 };
  // The forestay from the masthead to the bowsprit's end, which the jib is set on.
  const stay = (t: number) => ({ x: main.x + (sprit.x - main.x) * t, y: top + (sprit.y - top) * t });
  const jibHead = stay(0.3);
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
      <line x1={main.x} y1={top} x2={sprit.x} y2={sprit.y} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      <line x1={mizzen.x} y1={mizzenTop} x2={main.x} y2={top + 40} stroke={ROPE} strokeWidth={1.5} opacity={0.8} />
      {/* Shrouds on the main mast */}
      {[-60, -36, 16, 40].map((dx) => (
        <line key={dx} x1={main.x + dx} y1={D} x2={main.x} y2={course.top - 6} stroke={ROPE} strokeWidth={1.2} opacity={0.6} />
      ))}
      {/* Masts and pennants */}
      {[
        { x: mizzen.x, top: mizzenTop, h: mizzen.h, w: 7, flag: 66 },
        { x: main.x, top, h: main.h, w: 9, flag: 90 },
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
          {/* The jib */}
          <path d={`M ${jibHead.x} ${jibHead.y} L ${jibTack.x - 4} ${jibTack.y + 2} L 172 ${D - 26} Z`} fill={SAIL_SHADE} />
        </>
      ) : (
        // Sails furled: rolled on the yards and the rear boom.
        <g>
          {GALLEON_SAILS.map((s, i) => (
            <rect key={i} x={main.x - s.topHw - 8} y={s.top - 6} width={s.topHw * 2 + 16} height={12} rx={6} fill={SAIL_SHADE} />
          ))}
          <rect x={mizzen.x - 74} y={C - 20} width={71} height={9} rx={4.5} fill={SAIL_SHADE} />
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
