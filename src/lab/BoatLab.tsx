import React from "react";
import { BOATS, type BoatKind } from "../members";
import { BoatShape } from "../scene/Boat";
import { Bob } from "../scene/Motion";
import { PROPOSALS, type BoatProps } from "./proposals";

// The boat proposals side by side (dev only, not part of the site): a row per proposal, a
// column per boat, the current boats on top for reference. Real member avatars, on the
// night sea, bobbing.

const KINDS: BoatKind[] = ["dinghy", "sloop", "brig", "galleon"];
const AVATARS = [
  { name: "Piotron", image: "https://images.opencollective.com/piotron/avatar/128.png" },
  { name: "Jesse Dhillon", image: "https://images.opencollective.com/jesse-dhillon/avatar/128.png" },
  { name: "Coding Koala", image: "https://images.opencollective.com/codingkoalageneral1/avatar/128.png" },
  { name: "Acme Corp", image: undefined },
];

const Current: React.FC<BoatProps> = ({ kind, image, name, uid }) => <BoatShape kind={kind} image={image} name={name} uid={uid} />;
const ROWS = [{ id: "current", name: "Current", blurb: "What the site shows today, for reference.", Boat: Current }, ...PROPOSALS];

export const BoatLab: React.FC = () => (
  <main className="lab">
    <header>
      <h1>Boat proposals</h1>
      <p>A row per proposal, a boat per column, drawn at their real relative sizes. Boats can be mixed across rows.</p>
    </header>
    <div className="lab-grid">
      <div />
      {KINDS.map((k) => {
        const b = BOATS.find((x) => x.id === k)!;
        return (
          <div key={k} className="lab-col">
            <strong>{b.name}</strong> <span>{b.range} / mo</span>
          </div>
        );
      })}
      {ROWS.map((row) => (
        <React.Fragment key={row.id}>
          <div className={`lab-row-head${row.id === "current" ? " lab-current" : ""}`}>
            <h2>{row.name}</h2>
            <p>{row.blurb}</p>
          </div>
          {KINDS.map((k, i) => {
            const a = AVATARS[i];
            return (
              <div key={k} className={`lab-cell${row.id === "current" ? " lab-current" : ""}`}>
                <svg viewBox="-340 -480 700 540" aria-label={`${row.name}: ${k}`}>
                  <rect x={-340} y={-480} width={700} height={480} fill="url(#lab-sky)" />
                  <rect x={-340} y={0} width={700} height={60} fill="#0b5f7c" />
                  <defs>
                    <linearGradient id="lab-sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#1d3a4c" />
                      <stop offset="1" stopColor="#3d6c82" />
                    </linearGradient>
                  </defs>
                  <Bob delay={i * 1.3} deg={k === "galleon" ? 0.8 : 1.4}>
                    <row.Boat kind={k} image={a.image} name={a.name} uid={`${row.id}-${k}`} />
                  </Bob>
                  <rect x={-340} y={6} width={700} height={60} fill="#05384a" opacity={0.85} />
                </svg>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  </main>
);
