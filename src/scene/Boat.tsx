import React, { useLayoutEffect, useRef, useState } from "react";
import { TIERS, type Member, type Tier } from "../members";

// A member's sailing boat, in the flat style of the teaser's house-boat: a wooden hull, cream
// sails and a pennant in the tier's colour. The member's avatar is painted on the main sail.
// Drawn with its waterline at y 0, centred on x 0, in world units at full scale.

const WOOD = "#a9744f";
const WOOD_LINE = "#8a5b3b";
const WOOD_DARK = "#5a3522";
const SAIL = "#f4f1ea";
const SAIL_SHADE = "#e3dccb";
const ROPE = "#3b2b20";

type Mast = { x: number; h: number };
type Spec = { L: number; masts: Mast[]; jib: boolean };
export const BOAT_SPEC: Record<Tier, Spec> = {
  founder: { L: 300, masts: [{ x: -55, h: 290 }, { x: 60, h: 230 }], jib: true },
  yearly: { L: 235, masts: [{ x: 0, h: 250 }], jib: true },
  monthly: { L: 190, masts: [{ x: 0, h: 205 }], jib: true },
  once: { L: 130, masts: [{ x: 4, h: 140 }], jib: false },
};
export const boatHeight = (tier: Tier) => {
  const s = BOAT_SPEC[tier];
  return Math.max(...s.masts.map((m) => m.h)) + s.L * 0.14 + 24;
};

const tierColor = (tier: Tier) => TIERS.find((t) => t.id === tier)!.color;

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

export const BoatShape: React.FC<{ tier: Tier; active?: boolean; image?: string | null; name?: string; uid: string }> = ({
  tier,
  active = true,
  image,
  name = "",
  uid,
}) => {
  const { L, masts, jib } = BOAT_SPEC[tier];
  const [broken, setBroken] = useState(false);
  const deck = -L * 0.14;
  const bow = { x: L / 2 + L * 0.05, y: deck * 1.3 };
  const aft = masts[0];
  // Sail widths: the aft mast's sail reaches back over the stern, the fore mast's sail fills
  // the gap between the two masts.
  const sails = masts.map((m, i) => mainSail(m, deck, i === 0 ? Math.min(L * 0.4, m.x + L / 2 - 6) : m.x - masts[i - 1].x - 12));
  const fore = masts[masts.length - 1];
  const av = sails[0].avatar;
  const avatarAt = active ? av : { cx: -L * 0.2, cy: deck * 0.5, r: L * 0.055 };
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <g>
      {/* Masts and rigging */}
      {masts.map((m, i) => (
        <g key={i}>
          <rect x={m.x - 2.5} y={deck - m.h} width={5} height={m.h} rx={2} fill={WOOD_DARK} />
          <line x1={m.x} y1={deck - m.h} x2={-L / 2 + 4} y2={deck} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
          {/* Pennant in the tier's colour */}
          <path d={`M ${m.x + 2} ${deck - m.h} L ${m.x + 2 + L * 0.12} ${deck - m.h + 6} L ${m.x + 2} ${deck - m.h + 13} Z`} fill={tierColor(tier)} className="pennant" />
        </g>
      ))}
      <line x1={fore.x} y1={deck - fore.h} x2={bow.x} y2={bow.y} stroke={ROPE} strokeWidth={1.2} opacity={0.7} />
      {active ? (
        <>
          {sails.map((s, i) => (
            <path key={i} d={s.d} fill={i === 0 ? SAIL : SAIL_SHADE} />
          ))}
          {jib && (
            <path
              d={`M ${fore.x + 3} ${deck - fore.h + 22} L ${bow.x - L * 0.06} ${bow.y - 6} L ${fore.x + 3} ${deck - 12} Z`}
              fill={SAIL_SHADE}
            />
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
      {/* The member's avatar: on the main sail, or on the hull when the sails are furled.
          `data-cx` lets the fleet mirror it back when the boat sails left. */}
      <g className="avatar" data-cx={avatarAt.cx}>
      <defs>
        <clipPath id={`av-${uid}`}>
          <circle cx={avatarAt.cx} cy={avatarAt.cy} r={avatarAt.r} />
        </clipPath>
      </defs>
      <circle cx={avatarAt.cx} cy={avatarAt.cy} r={avatarAt.r + 2.5} fill={tierColor(tier)} />
      <circle cx={avatarAt.cx} cy={avatarAt.cy} r={avatarAt.r} fill="#123a4a" />
      {initials && (
        <text x={avatarAt.cx} y={avatarAt.cy} dy="0.36em" textAnchor="middle" fontSize={avatarAt.r * 0.9} fontWeight={700} fill="#fff">
          {initials}
        </text>
      )}
      {image && !broken && (
        <image
          href={image}
          x={avatarAt.cx - avatarAt.r}
          y={avatarAt.cy - avatarAt.r}
          width={avatarAt.r * 2}
          height={avatarAt.r * 2}
          clipPath={`url(#av-${uid})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setBroken(true)}
        />
      )}
      </g>
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
  const top = boatHeight(member.tier);
  const tier = TIERS.find((t) => t.id === member.tier)!;
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
        aria-label={`${member.name}, ${member.active ? tier.name : `former ${tier.name}`}`}
        onPointerEnter={() => onHold(true)}
        onPointerLeave={() => onHold(false)}
        onFocus={() => onHold(true)}
        onBlur={() => onHold(false)}
      >
        <g ref={boat}>
          <g className="bob" style={{ animationDelay: `${-delay}s` }}>
            <BoatShape tier={member.tier} active={member.active} image={member.image} name={member.name} uid={member.id.replace(/\W/g, "")} />
          </g>
        </g>
        <g ref={label} className="boat-label">
          <text textAnchor="middle" className="boat-name">
            {member.name}
          </text>
          <text textAnchor="middle" y={22} className="boat-tier">
            {member.active ? tier.name : `Former ${tier.name}`}
          </text>
        </g>
      </a>
    </g>
  );
};
