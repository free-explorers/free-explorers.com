import React, { useMemo } from "react";

// Under the sea, below the surface view: the water deepening to a dark blue, soft light rays
// from the surface, the lighthouse's rock running down to the seabed, sand dunes with rocks
// and swaying seaweed, bubbles rising. The camera dives here (see App); `top` is the
// underwater region's top (just under the surface), `bottom` the seabed's foot.

const SAND = "#3a4a46";
const SAND_LIGHT = "#4c5d57";
const ROCK = "#26303a";
const ROCK_LIGHT = "#323e4a";
const WEED = "#2f6b5a";
const WEED_LIGHT = "#3f8a6e";

const seeded = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

export const Depths: React.FC<{ x0: number; x1: number; top: number; bottom: number; rock: { x0: number; x1: number } }> = ({ x0, x1, top, bottom, rock }) => {
  const bed = bottom - 120;
  const d = useMemo(() => {
    const rnd = seeded(23);
    // Dunes along the seabed.
    let dunes = `M ${x0} ${bottom + 20} L ${x0} ${bed}`;
    for (let x = x0; x <= x1 + 200; x += 200) dunes += ` Q ${x + 100} ${bed - 18 - rnd() * 26} ${x + 200} ${bed + rnd() * 8}`;
    dunes += ` L ${x1 + 200} ${bottom + 20} Z`;
    const rocks = Array.from({ length: Math.floor((x1 - x0) / 260) }, () => ({ x: x0 + rnd() * (x1 - x0), w: 30 + rnd() * 70, h: 16 + rnd() * 40 }));
    const weeds = Array.from({ length: Math.floor((x1 - x0) / 70) }, () => ({ x: x0 + rnd() * (x1 - x0), h: 40 + rnd() * 110, dur: 3 + rnd() * 3, delay: rnd() * 3, light: rnd() < 0.4 }));
    const rays = Array.from({ length: Math.floor((x1 - x0) / 420) }, () => ({ x: x0 + rnd() * (x1 - x0), w: 40 + rnd() * 90, lean: 120 + rnd() * 180, dur: 5 + rnd() * 5, delay: rnd() * 5 }));
    const bubbles = Array.from({ length: Math.floor((x1 - x0) / 110) }, () => ({ x: x0 + rnd() * (x1 - x0), r: 1.5 + rnd() * 3.5, dur: 8 + rnd() * 10, delay: rnd() * 12 }));
    return { dunes, rocks, weeds, rays, bubbles };
  }, [x0, x1, bed, bottom]);

  // The lighthouse's rock, going down under its island to the seabed.
  const rockPath = `M ${rock.x0} ${top - 10} L ${rock.x1} ${top - 10} L ${rock.x1 - 40} ${top + (bed - top) * 0.3} L ${rock.x1 + 30} ${top + (bed - top) * 0.6} L ${rock.x1 + 80} ${bed + 10} L ${rock.x0} ${bed + 10} Z`;
  return (
    <g>
      <defs>
        <linearGradient id="depths" x1="0" y1={top} x2="0" y2={bottom} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#063f53" />
          <stop offset="0.5" stopColor="#042c3a" />
          <stop offset="1" stopColor="#021820" />
        </linearGradient>
      </defs>
      <rect x={x0} y={top} width={x1 - x0} height={bottom - top + 40} fill="url(#depths)" />
      {/* Light rays from the surface */}
      {d.rays.map((r, i) => (
        <path key={i} d={`M ${r.x} ${top} L ${r.x + r.w} ${top} L ${r.x + r.w + r.lean} ${bed} L ${r.x + r.lean} ${bed} Z`} fill="#bfe3ef" opacity={0.04}>
          <animate attributeName="opacity" values="0.02;0.07;0.02" dur={`${r.dur}s`} begin={`${-r.delay}s`} repeatCount="indefinite" />
        </path>
      ))}
      {/* The lighthouse's rock */}
      <path d={rockPath} fill={ROCK} />
      <path d={`M ${rock.x1 - 40} ${top + (bed - top) * 0.3} L ${rock.x1 + 30} ${top + (bed - top) * 0.6} L ${rock.x1 + 80} ${bed + 10} L ${rock.x1 - 30} ${bed + 10} Z`} fill={ROCK_LIGHT} />
      {/* The seabed */}
      <path d={d.dunes} fill={SAND} />
      <path d={d.dunes} fill="none" stroke={SAND_LIGHT} strokeWidth={4} />
      {d.rocks.map((r, i) => (
        <path key={i} d={`M ${r.x - r.w / 2} ${bed + 14} Q ${r.x - r.w / 2} ${bed - r.h} ${r.x} ${bed - r.h} Q ${r.x + r.w / 2} ${bed - r.h} ${r.x + r.w / 2} ${bed + 14} Z`} fill={i % 2 ? ROCK : ROCK_LIGHT} />
      ))}
      {d.weeds.map((w, i) => (
        <g key={i} transform={`translate(${w.x} ${bed + 6})`}>
          <path d={`M -4 0 Q -12 ${-w.h * 0.5} 0 ${-w.h} Q 10 ${-w.h * 0.5} 4 0 Z`} fill={w.light ? WEED_LIGHT : WEED}>
            <animateTransform attributeName="transform" type="skewX" values="-8;8;-8" dur={`${w.dur}s`} begin={`${-w.delay}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      {/* Bubbles rising */}
      {d.bubbles.map((b, i) => (
        <circle key={i} cx={b.x} cy={bed} r={b.r} fill="none" stroke="#cfe9f2" strokeWidth={1} opacity={0.35}>
          <animate attributeName="cy" values={`${bed};${top}`} dur={`${b.dur}s`} begin={`${-b.delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.4;0" dur={`${b.dur}s`} begin={`${-b.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
};
