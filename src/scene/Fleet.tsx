import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BOAT_SPEC, MemberBoat, type BoatParts } from "./Boat";
import type { Slot } from "./World";

// The explorers' boats sailing the whole sea, across every page: each one holds a heading
// (left or right) at its own slow speed and drifts between lanes, nearer or further out
// (smaller further out). A boat only ever turns about while it's off screen: now and then
// at random, and always once past either end of the sea. Boats stop while pointed at, so
// they're easy to click. Positions are written straight onto the SVG every frame, without
// re-rendering.

// Boat scale by distance: the further out (the smaller y), the smaller.
const DEPTH: [number, number][] = [
  [722, 0.34],
  [790, 0.56],
  [860, 0.72],
  [955, 0.94],
];
const depthScale = (y: number) => {
  if (y <= DEPTH[0][0]) return DEPTH[0][1];
  for (let i = 1; i < DEPTH.length; i++) {
    const [y0, s0] = DEPTH[i - 1];
    const [y1, s1] = DEPTH[i];
    if (y <= y1) return s0 + ((y - y0) / (y1 - y0)) * (s1 - s0);
  }
  return DEPTH[DEPTH.length - 1][1];
};
// Lanes: active explorers anywhere on the open sea, former explorers out on the horizon.
const ACTIVE_LANES = [770, 955];
const HORIZON_LANES = [722, 742];
const SPEED = 16; // world units per second, at full scale
const LANE_SPEED = 5; // world units per second towards the new lane
// How far past the sea's ends a boat sails before turning about (out of sight).
const OVERSHOOT = 60;

type Sim = {
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  lane: number;
  nextChange: number;
  shrink: number;
  half: number;
  former: boolean;
  held: boolean;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pickLane = (former: boolean) => (former ? rand(HORIZON_LANES[0], HORIZON_LANES[1]) : rand(ACTIVE_LANES[0], ACTIVE_LANES[1]));

// `seaW` is the whole sea's width (every page); `page` the page in view, `pageW` its width.
export const Fleet: React.FC<{ slots: Slot[]; seaW: number; page: number; pageW: number }> = memo(({ slots, seaW, page, pageW }) => {
  const sims = useRef(new Map<string, Sim>());
  const parts = useRef(new Map<string, BoatParts>());
  const bounds = useRef({ seaW, pageW });
  bounds.current = { seaW, pageW };
  // The pages in view: the current one, and the one the camera left until its slide ends.
  const view = useRef({ page, prev: page, until: 0 });
  if (view.current.page !== page) view.current = { page, prev: view.current.page, until: performance.now() / 1000 + 2 };
  // Draw order (back to front), updated when boats change lanes.
  const [order, setOrder] = useState<string[]>(() => slots.map((s) => s.member.id));

  // Start each new boat at its slot, heading off in a random direction; boats already at sea
  // keep sailing (only their size follows a new layout).
  useEffect(() => {
    const now = performance.now() / 1000;
    const next = new Map<string, Sim>();
    for (const s of slots) {
      const prev = sims.current.get(s.member.id);
      const half = (BOAT_SPEC[s.member.tier].L / 2) * 1.05;
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      next.set(
        s.member.id,
        prev
          ? { ...prev, shrink: s.shrink, half }
          : { x: s.x, y: s.y, dir, speed: rand(0.6, 1.3), lane: s.y, nextChange: now + rand(4, 16), shrink: s.shrink, half, former: !s.member.active, held: false },
      );
    }
    sims.current = next;
    setOrder([...next.entries()].sort((a, b) => a[1].y - b[1].y).map(([id]) => id));
  }, [slots]);

  const place = (id: string) => {
    const sim = sims.current.get(id);
    const p = parts.current.get(id);
    if (!sim || !p) return;
    const s = depthScale(sim.y) * sim.shrink;
    p.root.setAttribute("transform", `translate(${sim.x.toFixed(2)} ${sim.y.toFixed(2)})`);
    p.boat.setAttribute("transform", `scale(${(sim.dir * s).toFixed(4)} ${s.toFixed(4)})`);
    p.label.setAttribute("transform", `translate(0 ${(-p.top * s - 14).toFixed(1)})`);
    // Keep the avatar the right way round when the boat sails left.
    const cx = Number(p.avatar?.dataset.cx ?? 0);
    p.avatar?.setAttribute("transform", sim.dir < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : "");
  };

  const register = useCallback(
    (id: string) => (p: BoatParts | null) => {
      if (p) {
        parts.current.set(id, p);
        place(id);
      } else parts.current.delete(id);
    },
    [],
  );
  const hold = useCallback(
    (id: string) => (held: boolean) => {
      const sim = sims.current.get(id);
      if (sim) sim.held = held;
    },
    [],
  );
  // Stable callbacks per boat, so boats don't re-register on every render.
  const callbacks = useRef(new Map<string, { parts: (p: BoatParts | null) => void; hold: (h: boolean) => void }>());
  const cb = (id: string) => {
    let c = callbacks.current.get(id);
    if (!c) callbacks.current.set(id, (c = { parts: register(id), hold: hold(id) }));
    return c;
  };

  useLayoutEffect(() => {
    for (const id of sims.current.keys()) place(id);
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    let lastSort = 0;
    const tick = (nowMs: number) => {
      const dt = Math.min(0.1, (nowMs - last) / 1000);
      last = nowMs;
      const now = nowMs / 1000;
      const { seaW, pageW } = bounds.current;
      const v = view.current;
      const onScreen = (x: number, half: number) => {
        const seen = (p: number) => x + half > p * pageW - 10 && x - half < (p + 1) * pageW + 10;
        return seen(v.page) || (now < v.until && seen(v.prev));
      };
      for (const [id, sim] of sims.current) {
        if (!sim.held) {
          const s = depthScale(sim.y) * sim.shrink;
          const half = sim.half * s;
          const hidden = !onScreen(sim.x, half);
          // Past either end of the sea: turn about.
          if (sim.x < -half - OVERSHOOT && sim.dir < 0 && hidden) sim.dir = 1;
          if (sim.x > seaW + half + OVERSHOOT && sim.dir > 0 && hidden) sim.dir = -1;
          // Now and then, a new lane, and (out of sight only) maybe a new heading.
          if (now >= sim.nextChange) {
            if (hidden && Math.random() < 0.5) sim.dir = sim.dir === 1 ? -1 : 1;
            sim.lane = pickLane(sim.former);
            sim.speed = rand(0.6, 1.3);
            sim.nextChange = now + rand(10, 28);
          }
          sim.x += sim.dir * SPEED * sim.speed * s * dt;
          // A boat about to run into another in its lane steers to a lane in front of or
          // behind it.
          for (const other of sims.current.values()) {
            if (other === sim || other.former !== sim.former) continue;
            const dx = other.x - sim.x;
            const reach = (sim.half + other.half) * s * 1.15;
            if (Math.abs(other.y - sim.y) < 28 && Math.abs(dx) < reach && dx * sim.dir > 0) {
              const [a, b] = sim.former ? HORIZON_LANES : ACTIVE_LANES;
              const away = sim.y >= other.y ? 1 : -1;
              const target = sim.y + away * 48;
              sim.lane = target >= a && target <= b ? target : sim.y - away * 48;
              break;
            }
          }
          // Drift towards the lane.
          const dy = sim.lane - sim.y;
          sim.y += Math.sign(dy) * Math.min(Math.abs(dy), LANE_SPEED * dt);
        }
        place(id);
      }
      // Re-stack the boats when their depth order changes.
      if (now - lastSort > 0.5) {
        lastSort = now;
        const sorted = [...sims.current.entries()].sort((a, b) => a[1].y - b[1].y).map(([id]) => id);
        setOrder((o) => (o.length === sorted.length && o.every((id, i) => id === sorted[i]) ? o : sorted));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const byId = new Map(slots.map((s) => [s.member.id, s]));
  return (
    <g>
      {order.map((id) => {
        const s = byId.get(id);
        if (!s) return null;
        const c = cb(id);
        return <MemberBoat key={id} member={s.member} delay={s.delay} parts={c.parts} onHold={c.hold} />;
      })}
    </g>
  );
});
