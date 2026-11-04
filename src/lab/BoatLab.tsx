import React from "react";
import { BOATS, type BoatKind } from "../members";
import { BoatShape } from "../scene/Boat";
import { Bob } from "../scene/Motion";
import { VARIANTS } from "./variants";
import { CLOTH_MODES, ClothBoat } from "./cloth";

// Boat variations (dev only, not part of the site): a row per boat type, the current boat
// first, then five variants of the same style, each showing the donor a different way.
// Real member avatars; a sample company logo on the galleon.

const KINDS: BoatKind[] = ["dinghy", "sloop", "brig", "galleon"];

// A sample sponsor logo (wide, as company logos often are).
const ACME = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><rect width="200" height="120" fill="#e8573f"/><path d="M28 86 L54 30 L80 86 Z" fill="#fff"/><path d="M48 86 L62 58 L76 86 Z" fill="#e8573f"/><text x="92" y="74" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="34" fill="#fff">ACME</text></svg>`,
)}`;
const DONOR: Record<BoatKind, { name: string; image?: string }> = {
  dinghy: { name: "Piotron", image: "https://images.opencollective.com/piotron/avatar/128.png" },
  sloop: { name: "Jesse Dhillon", image: "https://images.opencollective.com/jesse-dhillon/avatar/128.png" },
  brig: { name: "CodingKoalaGeneral", image: "https://images.opencollective.com/codingkoalageneral1/avatar/128.png" },
  galleon: { name: "Acme Corp", image: ACME },
};
// Logos for the cloth proposals, one of each kind Open Collective serves: a transparent round
// logo, a transparent logo, an opaque square, a wide company logo. The fallback cell shows a
// member without a logo.
const CLOTH_DONOR: Record<BoatKind, { name: string; image?: string }> = {
  dinghy: { name: "Airbnb", image: "https://images.opencollective.com/airbnb/avatar/512.png" },
  sloop: { name: "Webpack", image: "https://images.opencollective.com/webpack/avatar/512.png" },
  brig: { name: "Sentry", image: "https://images.opencollective.com/sentry/9620d33/logo/512.png" },
  galleon: { name: "Acme Corp", image: ACME },
};
const NO_LOGO = "Rodolfo Hansen";

// Each row's frame, fitted to its boat (x, y, width, height), the waterline at 0.
const FRAME: Record<BoatKind, [number, number, number, number]> = {
  dinghy: [-130, -230, 280, 260],
  sloop: [-190, -320, 420, 360],
  brig: [-240, -380, 520, 430],
  galleon: [-390, -470, 750, 540],
};

const Cell: React.FC<{ kind: BoatKind; label: string; current?: boolean; children: React.ReactNode }> = ({ kind, label, current, children }) => {
  const [x, y, w, h] = FRAME[kind];
  return (
    <figure className={`lab-cell${current ? " lab-current" : ""}`}>
      <svg viewBox={`${x} ${y} ${w} ${h}`} aria-label={label}>
        <defs>
          <linearGradient id={`sky-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d3a4c" />
            <stop offset="1" stopColor="#3d6c82" />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={w} height={-y} fill={`url(#sky-${kind})`} />
        <rect x={x} y={0} width={w} height={h + y} fill="#0b5f7c" />
        {children}
        <rect x={x} y={6} width={w} height={h + y} fill="#05384a" opacity={0.85} />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
};

export const BoatLab: React.FC = () => (
  <main className="lab">
    <header>
      <h1>Logo as sail cloth</h1>
      <p>
        The donor's name on the hull and their logo as sail cloth, on the site's boats. Five treatments per boat, then the fallback for a donor without a logo.
        Logos of each kind Open Collective serves: transparent round (Airbnb), transparent (Webpack), an opaque square (Sentry), a wide company logo (sample).
      </p>
    </header>
    {KINDS.map((kind) => {
      const b = BOATS.find((x) => x.id === kind)!;
      const donor = CLOTH_DONOR[kind];
      return (
        <section key={`cloth-${kind}`} className="lab-row">
          <h2>
            {b.name} <span>{b.range} / mo</span>
          </h2>
          <div className="lab-cells">
            {CLOTH_MODES.map((c, i) => (
              <Cell key={c.mode} kind={kind} label={`${i + 1} · ${c.label}`}>
                <Bob delay={i * 1.1} deg={kind === "galleon" ? 0.8 : 1.4}>
                  <ClothBoat kind={kind} mode={c.mode} image={c.mode === "plain" ? undefined : donor.image} name={c.mode === "plain" ? NO_LOGO : donor.name} uid={`cl-${kind}-${c.mode}`} color={b.color} />
                </Bob>
              </Cell>
            ))}
          </div>
        </section>
      );
    })}
    <header className="lab-later">
      <h1>Earlier: boat variations</h1>
      <p>Five variants per boat in the site's style, each showing the donor a different way: a big logo, a printed sail, a flag, a spinnaker, a name streamer, their name on the hull. The current boat comes first.</p>
    </header>
    {KINDS.map((kind) => {
      const b = BOATS.find((x) => x.id === kind)!;
      const donor = DONOR[kind];
      return (
        <section key={kind} className="lab-row">
          <h2>
            {b.name} <span>{b.range} / mo</span>
          </h2>
          <div className="lab-cells">
            <Cell kind={kind} label="Current" current>
              <Bob deg={kind === "galleon" ? 0.8 : 1.4}>
                <BoatShape kind={kind} image={donor.image} name={donor.name} uid={`cur-${kind}`} />
              </Bob>
            </Cell>
            {VARIANTS[kind].map((v, i) => (
              <Cell key={v.id} kind={kind} label={`${i + 1} · ${v.label}`}>
                <Bob delay={i * 1.1} deg={kind === "galleon" ? 0.8 : 1.4}>
                  <v.Boat image={donor.image} name={donor.name} uid={v.id} color={b.color} />
                </Bob>
              </Cell>
            ))}
          </div>
        </section>
      );
    })}
  </main>
);
