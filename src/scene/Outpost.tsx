import React from "react";
// Ported from the Veshell teaser (veshell_video/teaser/src/components/Outpost.tsx).
const COLORS = { teal: "#006888" };

// The Free Explorers' guild: a rock by the water with the guild hall on it, and steps
// down to a stone quay. The lighthouse is the
// hall's tower, at its right end; the hall's roof slopes down from the tower to the left,
// running off-screen, with an observatory dome rising through it. Everything here is drawn
// behind the lighthouse, whose door is the hall's entrance. In house units around the
// lighthouse's foot (x, foot) and the sea level (water); `lit` lights the windows.
type Props = { x: number; foot: number; water: number; lit: number };

const ROCK = "#5d5b66";
const ROCK_DARK = "#4a4852";
const ROCK_LIGHT = "#76737f";
const STONE = "#a7a3ad";
const STONE_LINE = "#86828d";
const SLATE = "#26343f";
const SLATE_DARK = "#1c2730";
const FAR_LEFT = -30000;
const NAVE_SCALE = 0.85;

// The roof: from the tower's side down to the left, past the frame's edge.
const ROOF = { atTower: -2650, slope: 0.32, towerX: -420 };

const Window: React.FC<{ x: number; y: number; w: number; h: number; lit: number }> = ({ x, y, w, h, lit }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="#3b2b20" />
    <rect x={x + 22} y={y + 22} width={w - 44} height={h - 44} rx={w / 2 - 22} fill="#8a7f6a" />
    <rect x={x + 22} y={y + 22} width={w - 44} height={h - 44} rx={w / 2 - 22} fill="#ffd66b" opacity={lit} />
    <rect x={x + w / 2 - 8} y={y + 22} width={16} height={h - 44} fill="#3b2b20" />
  </g>
);

export const OutpostBack: React.FC<Props & { style?: "hall" | "church" }> = ({ x, foot, water, lit, style = "church" }) => {
  // A steep rock: a sheer cliff right under the lighthouse, rough ledges to the left.
  // The rock, close to the water: a short cliff under the lighthouse, with stone steps
  // down to a stone quay with a mooring post.
  const rock = [
    `M ${x + FAR_LEFT} ${water + 80}`,
    `L ${x + FAR_LEFT} ${foot - 200}`,
    `L ${x - 5200} ${foot - 160}`,
    `L ${x - 4200} ${foot}`,
    `L ${x + 900} ${foot}`,
    `L ${x + 1150} ${foot + 260}`,
    `L ${x + 1350} ${foot + 420}`,
    `L ${x + 1650} ${water + 80}`,
    "Z",
  ].join(" ");
  const face = [
    `M ${x - 400} ${foot + 120}`,
    `L ${x + 700} ${foot + 260}`,
    `L ${x + 1250} ${foot + 480}`,
    `L ${x + 1650} ${water + 80}`,
    `L ${x - 900} ${water + 80}`,
    "Z",
  ].join(" ");
  const steps = Array.from({ length: 8 }, (_, i) => ({
    x: x + 950 + i * 95,
    y: foot + i * ((water - 90 - foot) / 8),
  }));
  // The hall: from far left to the tower, its roof sloping down from the tower.
  const roofAt = (dx: number) => foot + ROOF.atTower + (ROOF.towerX - dx) * ROOF.slope;
  const wallRight = x + ROOF.towerX + 40;
  const roof = `M ${x + ROOF.towerX} ${roofAt(ROOF.towerX) - 60} L ${x + FAR_LEFT} ${roofAt(FAR_LEFT) - 60} L ${x + FAR_LEFT} ${roofAt(FAR_LEFT) + 140} L ${x + ROOF.towerX} ${roofAt(ROOF.towerX) + 140} Z`;
  const wall = `M ${wallRight} ${foot} L ${wallRight} ${roofAt(ROOF.towerX) + 100} L ${x + FAR_LEFT} ${roofAt(FAR_LEFT) + 100} L ${x + FAR_LEFT} ${foot} Z`;

  // Observatory: a drum rising through the roof, with a teal dome and a telescope.
  const obs = { dx: -1750, r: 560 };
  const obsTop = roofAt(obs.dx) - 700;
  const ocx = x + obs.dx;

  return (
    <g>
      {/* Rock */}
      <path d={rock} fill={ROCK} />
      <path d={face} fill={ROCK_DARK} />
      <path d={`M ${x - 5200} ${foot - 160} L ${x - 4200} ${foot}`} stroke={ROCK_LIGHT} strokeWidth={40} strokeLinecap="round" />
      {/* Stone steps down to the quay */}
      {steps.map((st, i) => (
        <rect key={i} x={st.x} y={st.y} width={180} height={60} rx={6} fill={STONE_LINE} />
      ))}
      <rect x={x + 1650} y={water - 110} width={1300} height={140} rx={12} fill={STONE} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={x + 1650 + i * 260} y={water - 110} width={8} height={140} fill={STONE_LINE} />
      ))}
      <rect x={x + 2780} y={water - 270} width={80} height={170} rx={20} fill="#6a432c" />

      {style === "church" && (
        // The nave is a little smaller than full scale, so the lighthouse reads as its tower;
        // scaled about where it meets the tower, at ground level.
        <g transform={`translate(${x - 380} ${foot}) scale(${NAVE_SCALE}) translate(${-(x - 380)} ${-foot})`}>
          <Church x={x} foot={foot} water={water} lit={lit} />
        </g>
      )}
      {style === "hall" && (<>
      {/* Hall walls, with lit windows */}
      <path d={wall} fill={STONE} />
      {Array.from({ length: 16 }, (_, r) => (
        <rect key={r} x={x + FAR_LEFT} y={foot - (r + 1) * 140} width={wallRight - x - FAR_LEFT} height={10} fill={STONE_LINE} />
      ))}
      {Array.from({ length: 6 }, (_, k) => {
        const wx = -1100 - k * 620;
        return (
          <g key={k}>
            <Window x={x + wx} y={foot - 620} w={260} h={400} lit={lit} />
            {roofAt(wx + 130) < foot - 1500 && <Window x={x + wx} y={foot - 1350} w={260} h={400} lit={lit} />}
          </g>
        );
      })}

      {/* Observatory drum and dome */}
      <rect x={ocx - obs.r} y={obsTop} width={obs.r * 2} height={roofAt(obs.dx) - obsTop + 200} fill={STONE} />
      {Array.from({ length: 6 }, (_, r) => (
        <rect key={r} x={ocx - obs.r} y={obsTop + (r + 1) * 130} width={obs.r * 2} height={10} fill={STONE_LINE} />
      ))}
      <rect x={ocx - obs.r - 50} y={obsTop - 40} width={obs.r * 2 + 100} height={60} rx={20} fill={SLATE_DARK} />
      <path d={`M ${ocx - obs.r - 20} ${obsTop - 20} A ${obs.r + 20} ${obs.r + 20} 0 0 1 ${ocx + obs.r + 20} ${obsTop - 20} Z`} fill={COLORS.teal} />
      <rect x={ocx - 70} y={obsTop - obs.r - 20} width={140} height={obs.r} fill="#123a4a" />
      <rect x={ocx - 45} y={obsTop - obs.r - 300} width={90} height={500} rx={34} fill="#3b3a44" transform={`rotate(30 ${ocx} ${obsTop - obs.r / 2})`} />

      {/* Roof, sloping down from the tower */}
      <path d={roof} fill={SLATE} />
      <path d={`M ${x + ROOF.towerX} ${roofAt(ROOF.towerX) + 140} L ${x + FAR_LEFT} ${roofAt(FAR_LEFT) + 140}`} stroke={SLATE_DARK} strokeWidth={36} />
      </>)}
    </g>
  );
};

// The church: the lighthouse is its bell tower, the nave runs off-screen to the left behind
// it, with pointed lit windows between buttresses and a slate roof.
const CHURCH_STONE = "#c9c2b5";
const CHURCH_LINE = "#a9a193";
const Lancet: React.FC<{ x: number; y: number; w: number; h: number; lit: number }> = ({ x, y, w, h, lit }) => {
  const arch = (inset: number) =>
    `M ${x + inset} ${y + h} L ${x + inset} ${y + w * 0.7} Q ${x + inset} ${y + inset} ${x + w / 2} ${y + inset * 0.6} Q ${x + w - inset} ${y + inset} ${x + w - inset} ${y + w * 0.7} L ${x + w - inset} ${y + h} Z`;
  return (
    <g>
      <path d={arch(0)} fill="#3b2b20" />
      <path d={arch(24)} fill="#8a7f6a" />
      <path d={arch(24)} fill="#ffd66b" opacity={lit} />
      {/* A touch of stained glass */}
      <rect x={x + 24} y={y + h * 0.55} width={w - 48} height={h * 0.18} fill={COLORS.teal} opacity={0.45 * lit} />
      <rect x={x + w / 2 - 8} y={y + 40} width={16} height={h - 40} fill="#3b2b20" />
      <rect x={x + 24} y={y + h * 0.5} width={w - 48} height={14} fill="#3b2b20" />
    </g>
  );
};

// A round-arched wooden window with a stone surround, cross bars and a sill (matching the
// lighthouse's door).
const ArchedWindow: React.FC<{ x: number; y: number; w: number; h: number; lit: number }> = ({ x, y, w, h, lit }) => {
  const arch = (i: number) => `M ${x + i} ${y + h - i} L ${x + i} ${y + w / 2} A ${w / 2 - i} ${w / 2 - i} 0 0 1 ${x + w - i} ${y + w / 2} L ${x + w - i} ${y + h - i} Z`;
  const s = 50;
  return (
    <g>
      <path d={`M ${x - s} ${y + h + s / 2} L ${x - s} ${y + w / 2} A ${w / 2 + s} ${w / 2 + s} 0 0 1 ${x + w + s} ${y + w / 2} L ${x + w + s} ${y + h + s / 2} Z`} fill={CHURCH_LINE} />
      <path d={arch(0)} fill="#7a4b2e" />
      <path d={arch(30)} fill="#3b2b20" />
      <path d={arch(30)} fill="#ffd66b" opacity={lit} />
      <rect x={x + w / 2 - 12} y={y + 30} width={24} height={h - 60} fill="#7a4b2e" />
      {[0.45, 0.72].map((f, k) => (
        <rect key={k} x={x + 30} y={y + h * f} width={w - 60} height={24} fill="#7a4b2e" />
      ))}
      <rect x={x - s} y={y + h} width={w + 2 * s} height={50} rx={14} fill={CHURCH_LINE} />
    </g>
  );
};

const Church: React.FC<Props> = ({ x, foot, lit }) => {
  const right = x - 0; // the nave meets the tower here
  const eave = foot - 1550;
  const ridge = foot - 2500;
  const bay = 760;
  return (
    <g>
      {/* Roof: a steep slate roof seen from the side, rising to the tower */}
      <path d={`M ${x + FAR_LEFT} ${eave + 40} L ${x + FAR_LEFT} ${ridge} L ${right} ${ridge} L ${right} ${eave + 40} Z`} fill={SLATE} />
      {Array.from({ length: 6 }, (_, r) => (
        <rect key={r} x={x + FAR_LEFT} y={ridge + (r + 1) * ((eave - ridge) / 7)} width={right - x - FAR_LEFT} height={12} fill={SLATE_DARK} />
      ))}
      {/* Nave wall */}
      <rect x={x + FAR_LEFT} y={eave} width={right - x - FAR_LEFT} height={foot - eave} fill={CHURCH_STONE} />
      {Array.from({ length: 11 }, (_, r) => (
        <rect key={r} x={x + FAR_LEFT} y={foot - (r + 1) * 140} width={right - x - FAR_LEFT} height={10} fill={CHURCH_LINE} />
      ))}
      {/* Shadow under the eave */}
      <rect x={x + FAR_LEFT} y={eave + 30} width={right - x - FAR_LEFT} height={90} fill="#000" opacity={0.16} />
      <rect x={x + FAR_LEFT} y={eave - 30} width={right + 60 - x - FAR_LEFT} height={60} fill={CHURCH_LINE} />
      {/* Bays: a tall pointed window between buttresses */}
      {Array.from({ length: 8 }, (_, k) => {
        const bx = right - 700 - k * bay;
        return (
          <g key={k}>
            <ArchedWindow x={bx + 230} y={foot - 1230} w={300} h={760} lit={lit} />
            {/* Buttress with a small pinnacle */}
            <path d={`M ${bx - 90} ${foot} L ${bx - 90} ${foot - 1150} L ${bx - 40} ${foot - 1650} L ${bx + 40} ${foot - 1650} L ${bx + 90} ${foot - 1150} L ${bx + 90} ${foot} Z`} fill={CHURCH_LINE} />
            {/* Its shaded side */}
            <path d={`M ${bx + 20} ${foot} L ${bx + 20} ${foot - 1650} L ${bx + 40} ${foot - 1650} L ${bx + 90} ${foot - 1150} L ${bx + 90} ${foot} Z`} fill="#000" opacity={0.14} />
            <path d={`M ${bx - 50} ${foot - 1650} L ${bx} ${foot - 1880} L ${bx + 50} ${foot - 1650} Z`} fill={SLATE} />
          </g>
        );
      })}
      {/* Seafaring details on the façade */}
      <NauticalDetails right={right} foot={foot} bay={bay} />
    </g>
  );
};

const ROPE = "#c9a46b";
const ROPE_DARK = "#9c7a45";
const IRON = "#2f2e36";

// Rope swags between the buttresses, a life buoy, an anchor against the wall and a ship's
// bell on a bracket. `right` is where the nave meets the tower; buttress k is at
// right - 700 - k * bay.
const NauticalDetails: React.FC<{ right: number; foot: number; bay: number }> = ({ right, foot, bay }) => {
  const buttress = (k: number) => right - 700 - k * bay;
  const swagY = foot - 1440;
  return (
    <g>
      {/* Rope swags hanging between buttresses, under the eave */}
      {[0, 1, 2, 3].map((k) => {
        const a = buttress(k + 1);
        const b = buttress(k);
        return (
          <g key={k}>
            <path d={`M ${a + 90} ${swagY} Q ${(a + b) / 2} ${swagY + 260} ${b - 90} ${swagY}`} stroke={ROPE} strokeWidth={34} fill="none" strokeLinecap="round" />
            <path d={`M ${a + 90} ${swagY} Q ${(a + b) / 2} ${swagY + 260} ${b - 90} ${swagY}`} stroke={ROPE_DARK} strokeWidth={34} fill="none" strokeDasharray="20 28" strokeLinecap="round" />
          </g>
        );
      })}
      {/* Anchor resting on the ground, leaning against the first buttress */}
      <g transform={`translate(${buttress(0) - 660} ${foot + 40}) rotate(-14)`} fill={IRON}>
        <Anchor />
      </g>
    </g>
  );
};

// A classic anchor: ring, stock, shank, and curved arms ending in broad spade-shaped flukes
// pointing up and out. Its crown (bottom) is at y = -40.
export const Anchor: React.FC = () => {
  const fluke = (side: 1 | -1) => {
    // Tip of the arm, and the fluke's spade around it, pointing up and outward.
    const tx = side * 330;
    const ty = -300;
    return (
      <path
        d={`M ${tx} ${ty - 120} L ${tx + side * 95} ${ty + 30} L ${tx + side * 20} ${ty + 10} L ${tx - side * 10} ${ty + 70} L ${tx - side * 70} ${ty - 10} Z`}
      />
    );
  };
  return (
    <g fill={IRON}>
      <circle cx={0} cy={-820} r={62} fill="none" stroke={IRON} strokeWidth={30} />
      <rect x={-28} y={-760} width={56} height={720} rx={14} />
      <rect x={-210} y={-650} width={420} height={46} rx={23} />
      <circle cx={-215} cy={-627} r={30} />
      <circle cx={215} cy={-627} r={30} />
      {/* Arms: a thick curve from tip to tip through the crown */}
      <path d="M -320 -330 Q -300 -40 0 -40 Q 300 -40 320 -330" fill="none" stroke={IRON} strokeWidth={60} strokeLinecap="round" />
      <circle cx={0} cy={-40} r={46} />
      {fluke(-1)}
      {fluke(1)}
    </g>
  );
};

// Details on the lighthouse tower itself, drawn in front of it: a life buoy up and to the
// left of the door, and the ship's bell on a bracket off its sea side, above the steps.
// `halfWidth(h)` is the tower's half-width h house units above its foot.
export const TowerDetails: React.FC<{ x: number; foot: number; halfWidth: (h: number) => number }> = ({ x, foot, halfWidth }) => {
  const bellH = 820;
  const edge = x + halfWidth(bellH);
  return (
    <g>
      {/* Life buoy */}
      <g transform={`translate(${x - 400} ${foot - 800})`}>
        <circle r={115} fill="none" stroke="#e8573f" strokeWidth={56} />
        {[45, 135, 225, 315].map((a) => (
          <rect key={a} x={-28} y={-143} width={56} height={56} fill="#fbfaf6" transform={`rotate(${a})`} />
        ))}
        <circle r={115} fill="none" stroke={ROPE} strokeWidth={9} strokeDasharray="38 26" />
      </g>
      {/* Ship's bell on an iron bracket, over the steps */}
      <g transform={`translate(${edge} ${foot - bellH})`}>
        <path d="M 0 0 L 300 0 L 300 36 L 40 36 Z" fill={IRON} />
        <path d="M 0 36 L 0 160 L 90 36 Z" fill={IRON} />
        <rect x={232} y={36} width={20} height={44} fill={IRON} />
        <path d="M 150 270 Q 150 100 242 80 Q 334 100 334 270 Z" fill="#c99a3a" />
        <rect x={135} y={260} width={214} height={30} rx={12} fill="#b8862e" />
        <circle cx={242} cy={310} r={22} fill="#8a6420" />
      </g>
    </g>
  );
};
