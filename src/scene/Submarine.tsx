import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Member } from "../members";

// The submarines of one-time donors and former monthly/yearly donors, cruising under the sea:
// old-style wooden hulls with copper fittings (bands, nose, conning tower, fins), a conning tower, a periscope, a propeller and a lit
// headlight; the donor's picture in the big brass porthole, their name on the hull. Each is
// sized by all its donor has given. Drawn centred on (0, 0), bow to the right; full size is
// SUB_LENGTH long.

export const SUB_LENGTH = 220;
const COPPER = "#b87333";
const COPPER_DARK = "#7e4a22";
const BRASS = "#d9a441";
const RIVET = "#8a5524";
const WOOD = "#a9744f";
const WOOD_LINE = "#8a5b3b";
const WOOD_DARK = "#5a3522";
const GLASS = "#123a4a";
const LIGHT = "#ffd66b";
const CREAM = "#f4f1ea";
const FONT = "Outfit, 'Helvetica Neue', Arial, sans-serif";

// Size from the total given: from 0.35 for a dollar to 0.9 from $20,000, on a log scale.
export const subScale = (total: number) => 0.35 + 0.55 * Math.min(1, Math.max(0, Math.log10(Math.max(1, total)) / Math.log10(20000)));

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const SubShape: React.FC<{ name: string; image?: string | null; uid: string }> = ({ name, image, uid }) => {
  const [broken, setBroken] = useState(false);
  const L = SUB_LENGTH;
  const H = 54; // hull height
  const hull = `M ${-L / 2 + 14} ${-H / 2} L ${L / 2 - 40} ${-H / 2} Q ${L / 2 + 6} ${-H / 2 + 4} ${L / 2 + 6} 0 Q ${L / 2 + 6} ${H / 2 - 4} ${L / 2 - 40} ${H / 2} L ${-L / 2 + 14} ${H / 2} Q ${-L / 2 - 20} ${H / 4} ${-L / 2 - 26} 0 Q ${-L / 2 - 20} ${-H / 4} ${-L / 2 + 14} ${-H / 2} Z`;
  const port = { cx: L * 0.2, cy: -2, r: 19 };
  const text = name.toUpperCase();
  // Long names get a smaller font rather than squeezed letters (which hop about when moving).
  const max = L * 0.42;
  const fitSize = Math.min(12, max / Math.max(1, text.length * 0.68));
  return (
    <g>
      {/* The headlight's beam, ahead */}
      <path d={`M ${L / 2 + 4} -6 L ${L / 2 + 190} -54 L ${L / 2 + 190} 46 L ${L / 2 + 4} 6 Z`} fill={LIGHT} opacity={0.1} />
      <path d={`M ${L / 2 + 4} -4 L ${L / 2 + 120} -24 L ${L / 2 + 120} 20 L ${L / 2 + 4} 4 Z`} fill={LIGHT} opacity={0.12} />
      {/* Propeller (spinning) and rudder fins at the stern */}
      <g transform={`translate(${-L / 2 - 30} 0)`}>
        <rect x={-4} y={-3} width={10} height={6} fill={COPPER_DARK} />
        {/* Spinning: three blade positions fading into one another (only opacity animates, so
            the submarine's shape never changes and nothing on it jitters) */}
        {[18, 10, 4].map((ry, k) => (
          <ellipse key={ry} cx={-6} cy={0} rx={4} ry={ry} fill={BRASS} opacity={k === 0 ? 1 : 0}>
            <animate attributeName="opacity" values={k === 0 ? "1;0;0;1" : k === 1 ? "0;1;0;0" : "0;0;1;0"} keyTimes="0;0.33;0.66;1" dur="0.45s" repeatCount="indefinite" />
          </ellipse>
        ))}
      </g>
      <path d={`M ${-L / 2 - 6} -8 L ${-L / 2 - 22} -30 L ${-L / 2 - 2} -30 L ${-L / 2 + 14} -10 Z`} fill={COPPER_DARK} />
      <path d={`M ${-L / 2 - 6} 8 L ${-L / 2 - 22} 30 L ${-L / 2 - 2} 30 L ${-L / 2 + 14} 10 Z`} fill={COPPER_DARK} />
      {/* Conning tower with its portholes, a periscope and a rail */}
      <path d={`M ${-L * 0.16} ${-H / 2 + 2} L ${-L * 0.13} ${-H / 2 - 34} Q ${-L * 0.03} ${-H / 2 - 44} ${L * 0.07} ${-H / 2 - 34} L ${L * 0.1} ${-H / 2 + 2} Z`} fill={COPPER} />
      {[-0.08, 0.02].map((f) => (
        <g key={f}>
          <circle cx={L * f} cy={-H / 2 - 16} r={6} fill={BRASS} />
          <circle cx={L * f} cy={-H / 2 - 16} r={4} fill={LIGHT} />
        </g>
      ))}
      <path d={`M ${L * 0.04} ${-H / 2 - 36} L ${L * 0.04} ${-H / 2 - 64} L ${L * 0.1} ${-H / 2 - 64}`} stroke={COPPER_DARK} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* Hull: wooden planks, a darker belly, copper bands with rivets, a copper-sheathed nose */}
      <defs>
        <clipPath id={`sub-${uid}`}>
          <path d={hull} />
        </clipPath>
      </defs>
      <path d={hull} fill={WOOD} />
      <g clipPath={`url(#sub-${uid})`}>
        {[-0.3, -0.1, 0.1, 0.3].map((f) => (
          <rect key={f} x={-L} y={H * f} width={L * 2} height={1.6} fill={WOOD_LINE} />
        ))}
        <rect x={-L} y={H * 0.2} width={L * 2} height={H} fill={WOOD_DARK} opacity={0.45} />
        <rect x={L / 2 - 30} y={-H} width={60} height={H * 2} fill={COPPER} />
        <rect x={L / 2 - 30} y={-H} width={4} height={H * 2} fill={COPPER_DARK} />
        {[-0.34, -0.04, 0.3].map((f) => (
          <g key={f}>
            <rect x={L * f} y={-H} width={9} height={H * 2} fill={COPPER} />
            <rect x={L * f + 7} y={-H} width={2} height={H * 2} fill={COPPER_DARK} />
            {Array.from({ length: 5 }, (_, k) => (
              <circle key={k} cx={L * f + 4.5} cy={-H / 2 + 7 + k * 10} r={1.4} fill={COPPER_DARK} />
            ))}
          </g>
        ))}
      </g>
      {/* Small lit portholes along the hull */}
      {[-0.4, -0.3].map((f) => (
        <g key={f}>
          <circle cx={L * f} cy={-4} r={7} fill={BRASS} />
          <circle cx={L * f} cy={-4} r={4.5} fill={LIGHT} />
        </g>
      ))}
      {/* The headlight */}
      <circle cx={L / 2 + 2} cy={0} r={6} fill={LIGHT} stroke={BRASS} strokeWidth={2.5} />
      {/* The donor's name on the hull, and their picture in the big porthole */}
      <g className="unflip" data-cx={-L * 0.08}>
        {/* rotate(0.01): an invisible tilt so the text is drawn as smooth shapes, not glyphs
            snapped to whole pixels (which made the name hop as the submarine drifts) */}
        <text transform={`rotate(0.01 ${-L * 0.08} 14)`} x={-L * 0.08} y={14} dy="0.36em" textAnchor="middle" fontSize={fitSize} fontWeight={800} letterSpacing={1} fill={CREAM} fontFamily={FONT}>
          {text}
        </text>
      </g>
      <circle cx={port.cx} cy={port.cy} r={port.r + 6} fill={BRASS} />
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        return <circle key={k} cx={port.cx + Math.cos(a) * (port.r + 3)} cy={port.cy + Math.sin(a) * (port.r + 3)} r={1.4} fill={RIVET} />;
      })}
      <g className="unflip" data-cx={port.cx}>
        <defs>
          <clipPath id={`sub-port-${uid}`}>
            <circle cx={port.cx} cy={port.cy} r={port.r} />
          </clipPath>
        </defs>
        <circle cx={port.cx} cy={port.cy} r={port.r} fill={GLASS} />
        <text transform={`rotate(0.01 ${port.cx} ${port.cy})`} x={port.cx} y={port.cy} dy="0.36em" textAnchor="middle" fontSize={port.r * 0.8} fontWeight={700} fill={CREAM} fontFamily={FONT}>
          {initialsOf(name)}
        </text>
        {image && !broken && (
          <image
            href={image}
            x={port.cx - port.r}
            y={port.cy - port.r}
            width={port.r * 2}
            height={port.r * 2}
            clipPath={`url(#sub-port-${uid})`}
            preserveAspectRatio="xMidYMid slice"
            onError={() => setBroken(true)}
          />
        )}
      </g>
      <path d={`M ${port.cx - port.r * 0.6} ${port.cy - port.r * 0.5} Q ${port.cx - port.r * 0.2} ${port.cy - port.r * 0.85} ${port.cx + port.r * 0.3} ${port.cy - port.r * 0.75}`} stroke="#fff" strokeWidth={2} opacity={0.35} fill="none" strokeLinecap="round" />
      {/* A trail of bubbles from the propeller */}
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={-L / 2 - 40} cy={0} r={2 + k} fill="#cfe9f2" opacity={0}>
          <animate attributeName="cx" values={`${-L / 2 - 40};${-L / 2 - 120}`} dur="2.4s" begin={`${-k * 0.6}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values="0;-40" dur="2.4s" begin={`${-k * 0.6}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="2.4s" begin={`${-k * 0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
};

const fmt = (n: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);

type SubParts = { root: SVGGElement; body: SVGGElement; unflip: SVGGElement[] };
const MemberSub: React.FC<{ member: Member; parts: (p: SubParts | null) => void; onHold: (h: boolean) => void }> = ({ member, parts, onHold }) => {
  const root = useRef<SVGGElement>(null);
  const body = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    parts({ root: root.current!, body: body.current!, unflip: [...body.current!.querySelectorAll<SVGGElement>(".unflip")] });
    return () => parts(null);
  }, [parts]);
  const k = subScale(member.total);
  return (
    <g ref={root}>
      <a
        href={member.profile}
        target="_blank"
        rel="noreferrer"
        className="boat"
        aria-label={`${member.name}, gave ${fmt(member.total, member.currency)} in total`}
        onPointerEnter={() => onHold(true)}
        onPointerLeave={() => onHold(false)}
        onFocus={() => onHold(true)}
        onBlur={() => onHold(false)}
      >
        <g ref={body}>
          <SubShape name={member.name} image={member.image} uid={member.id.replace(/\W/g, "")} />
        </g>
        <g className="boat-label" transform={`translate(0 ${-(54 / 2 + 70) * k - 16})`}>
          <text textAnchor="middle" className="boat-name">
            {member.name}
          </text>
          <text textAnchor="middle" y={22} className="boat-tier">
            Gave {fmt(member.total, member.currency)} in total
          </text>
        </g>
      </a>
    </g>
  );
};

// The submarines cruising: each at its own depth and slow speed, holding its heading on
// screen and turning about only out of sight (at the sea's ends, or now and then), drifting
// between depths. Stops while pointed at. Positions are written straight onto the SVG.
type Sim = { x: number; y: number; dir: 1 | -1; speed: number; depth: number; nextChange: number; k: number; held: boolean };
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const SPEED = 12;

export const SubFleet: React.FC<{ members: Member[]; seaW: number; top: number; bottom: number; visible: boolean; page: number; pageW: number }> = memo(
  ({ members, seaW, top, bottom, visible, page, pageW }) => {
    const sims = useRef(new Map<string, Sim>());
    const parts = useRef(new Map<string, SubParts>());
    const env = useRef({ seaW, top, bottom, visible, page, pageW });
    env.current = { seaW, top, bottom, visible, page, pageW };
    const [, force] = useState(0);

    useEffect(() => {
      const next = new Map<string, Sim>();
      for (const m of members) {
        const prev = sims.current.get(m.id);
        const depth = rand(top, bottom);
        next.set(m.id, prev ? { ...prev, k: subScale(m.total) } : { x: rand(0, seaW), y: depth, dir: Math.random() < 0.5 ? 1 : -1, speed: rand(0.5, 1.2), depth, nextChange: 0, k: subScale(m.total), held: false });
      }
      sims.current = next;
      force((n) => n + 1);
    }, [members, seaW, top, bottom]);

    const place = (id: string) => {
      const s = sims.current.get(id);
      const p = parts.current.get(id);
      if (!s || !p) return;
      p.root.setAttribute("transform", `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`);
      p.body.setAttribute("transform", `scale(${(s.dir * s.k).toFixed(3)} ${s.k.toFixed(3)})`);
      for (const el of p.unflip) {
        const cx = Number(el.dataset.cx ?? 0);
        el.setAttribute("transform", s.dir < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : "");
      }
    };
    const callbacks = useRef(new Map<string, { parts: (p: SubParts | null) => void; hold: (h: boolean) => void }>());
    const cb = useCallback((id: string) => {
      let c = callbacks.current.get(id);
      if (!c)
        callbacks.current.set(
          id,
          (c = {
            parts: (p) => {
              if (p) {
                parts.current.set(id, p);
                place(id);
              } else parts.current.delete(id);
            },
            hold: (h) => {
              const s = sims.current.get(id);
              if (s) s.held = h;
            },
          }),
        );
      return c;
    }, []);
    useLayoutEffect(() => {
      for (const id of sims.current.keys()) place(id);
    });

    useEffect(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let raf = 0;
      let last = performance.now();
      const tick = (nowMs: number) => {
        const dt = Math.min(0.1, (nowMs - last) / 1000);
        last = nowMs;
        const now = nowMs / 1000;
        const { seaW, top, bottom, visible, page, pageW } = env.current;
        for (const [id, s] of sims.current) {
          if (!s.held) {
            const half = (SUB_LENGTH / 2 + 40) * s.k;
            const seen = visible && s.x + half > page * pageW - 10 && s.x - half < (page + 1) * pageW + 10;
            if (s.x < -half - 60 && s.dir < 0 && !seen) s.dir = 1;
            if (s.x > seaW + half + 60 && s.dir > 0 && !seen) s.dir = -1;
            if (now >= s.nextChange) {
              if (s.nextChange > 0 && !seen && Math.random() < 0.5) s.dir = s.dir === 1 ? -1 : 1;
              s.depth = rand(top, bottom);
              s.nextChange = now + rand(12, 30);
            }
            s.x += s.dir * SPEED * s.speed * dt;
            const dy = s.depth - s.y;
            s.y += Math.sign(dy) * Math.min(Math.abs(dy), 4 * dt);
          }
          place(id);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);

    return (
      <g>
        {members.map((m) => {
          const c = cb(m.id);
          return <MemberSub key={m.id} member={m} parts={c.parts} onHold={c.hold} />;
        })}
      </g>
    );
  },
);
