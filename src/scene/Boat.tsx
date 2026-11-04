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
export const boatHeight = (kind: BoatKind) => {
  const s = BOAT_SPEC[kind];
  return kind === "galleon" ? GALLEON.deck + 330 + 30 : Math.max(...s.masts.map((m) => m.h)) + s.L * 0.14 + 24;
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
    <g className="avatar" data-cx={at.cx}>
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

type ShapeProps = { kind: BoatKind; active?: boolean; image?: string | null; name?: string; uid: string };

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
      <Avatar at={avatarAt} color={color} image={image} name={name} uid={uid} />
    </g>
  );
};

// The galleon: a deep hull with a raised stern castle (lit windows), a gold band and a row of
// gun ports; square sails on the fore and main masts, a lateen sail on the mizzen over the
// castle, a jib on the bowsprit, gold pennants. The sponsor's logo is on the main course.
const GALLEON = { deck: 62, castle: 116 };
const squareSail = (x: number, top: number, bottom: number, hw: number) =>
  `M ${x - hw} ${top} L ${x + hw} ${top} Q ${x + hw * 1.1} ${(top + bottom) / 2} ${x + hw * 0.94} ${bottom} Q ${x} ${bottom + 12} ${x - hw * 0.94} ${bottom} Q ${x - hw * 1.1} ${(top + bottom) / 2} ${x - hw} ${top} Z`;

const Galleon: React.FC<ShapeProps> = ({ active = true, image, name = "", uid }) => {
  const color = boatInfo("galleon").color;
  const D = -GALLEON.deck;
  const C = -GALLEON.castle;
  const hull = `M -238 ${C} L -118 ${C} L -118 ${D} L 200 ${D} L 246 ${D - 22} Q 205 40 150 44 L -160 44 Q -222 32 -238 ${C} Z`;
  // Masts: mizzen on the castle, main amidships, fore towards the bow.
  const main = { x: -10, h: 330 };
  const fore = { x: 135, h: 280 };
  const mizzen = { x: -170, h: 210 };
  const courses = [
    { m: main, hw: 82, lower: [D - 150, D - 34], upper: [D - 280, D - 162] },
    { m: fore, hw: 66, lower: [D - 130, D - 34], upper: [D - 240, D - 142] },
  ];
  const avatarAt = active ? { cx: main.x, cy: D - 94, r: 34 } : { cx: -178, cy: C + 26, r: 16 };
  const sprit = { x: 312, y: D - 64 };
  return (
    <g>
      {/* Masts, bowsprit and stays */}
      {[mizzen, main, fore].map((m, i) => {
        const base = m === mizzen ? C : D;
        return (
          <g key={i}>
            <rect x={m.x - 4} y={base - m.h} width={8} height={m.h} rx={3} fill={WOOD_DARK} />
            <path d={`M ${m.x + 3} ${base - m.h} L ${m.x + 3 + 70} ${base - m.h + 9} L ${m.x + 3} ${base - m.h + 18} Z`} fill={color} />
          </g>
        );
      })}
      <line x1={232} y1={D - 16} x2={sprit.x} y2={sprit.y} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
      <line x1={fore.x} y1={D - fore.h} x2={sprit.x} y2={sprit.y} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      <line x1={main.x} y1={D - main.h} x2={fore.x} y2={D - fore.h + 30} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      <line x1={mizzen.x} y1={C - mizzen.h} x2={main.x} y2={D - main.h + 40} stroke={ROPE} strokeWidth={1.6} opacity={0.75} />
      {active ? (
        <>
          {/* Lateen sail on the mizzen */}
          <path d={`M ${mizzen.x + 4} ${C - mizzen.h + 20} L ${mizzen.x + 60} ${C - 26} L ${mizzen.x - 70} ${C - 26} Z`} fill={SAIL_SHADE} />
          {/* Jib on the bowsprit */}
          <path d={`M ${fore.x + 8} ${D - fore.h + 40} L ${sprit.x - 8} ${sprit.y + 2} L ${fore.x + 30} ${D - 40} Z`} fill={SAIL_SHADE} />
          {/* Square sails, with their yards */}
          {courses.map(({ m, hw, lower, upper }, i) => (
            <g key={i}>
              <path d={squareSail(m.x, upper[0], upper[1], hw * 0.82)} fill={i === 0 ? SAIL : SAIL_SHADE} />
              <path d={squareSail(m.x, lower[0], lower[1], hw)} fill={i === 0 ? SAIL : SAIL_SHADE} />
              <rect x={m.x - hw * 0.82 - 8} y={upper[0] - 4} width={hw * 1.64 + 16} height={6} rx={3} fill={WOOD_DARK} />
              <rect x={m.x - hw - 8} y={lower[0] - 4} width={hw * 2 + 16} height={6} rx={3} fill={WOOD_DARK} />
            </g>
          ))}
        </>
      ) : (
        // Former sponsors: sails furled on the yards.
        courses.map(({ m, hw, lower, upper }, i) => (
          <g key={i}>
            <rect x={m.x - hw * 0.82 - 8} y={upper[0] - 6} width={hw * 1.64 + 16} height={12} rx={6} fill={SAIL_SHADE} />
            <rect x={m.x - hw - 8} y={lower[0] - 6} width={hw * 2 + 16} height={12} rx={6} fill={SAIL_SHADE} />
          </g>
        ))
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
        {/* Gold band, and the gun ports under it */}
        <rect x={-260} y={D + 8} width={520} height={7} fill={GOLD} />
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x={-96 + k * 38} y={D + 26} width={16} height={14} rx={2} fill="#2a1a10" />
        ))}
        {/* Stern castle: lit windows */}
        {[0, 1, 2].map((k) => (
          <rect key={k} x={-224 + k * 34} y={C + 14} width={20} height={22} rx={6} fill="#ffd66b" />
        ))}
        <rect x={-260} y={C + 44} width={160} height={5} fill={GOLD} />
        <rect x={-260} y={-1} width={520} height={60} fill={WOOD_DARK} opacity={0.55} />
      </g>
      {/* Rails along the castle and the deck */}
      <path d={`M -240 ${C} L -118 ${C} M -118 ${D} L 200 ${D} L 246 ${D - 22}`} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Avatar at={avatarAt} color={color} image={image} name={name} uid={uid} />
    </g>
  );
};

// A member's boat on the sea, bobbing, linking to their profile, with their name on hover.
// The fleet moves it: `parts` hands it the groups to transform (position, the boat's scale
// and heading, the label's height) and `onHold` pauses it while it's pointed at.
export type BoatParts = { root: SVGGElement; boat: SVGGElement; label: SVGGElement; avatar: SVGGElement | null; top: number };
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
    parts({ root: root.current!, boat: boat.current!, label: label.current!, avatar: boat.current!.querySelector<SVGGElement>(".avatar"), top });
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
          <Bob delay={delay} deg={member.boat === "galleon" ? 0.8 : 1.4}>
            <BoatShape kind={member.boat} active={member.active} image={member.image} name={member.name} uid={member.id.replace(/\W/g, "")} />
          </Bob>
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
