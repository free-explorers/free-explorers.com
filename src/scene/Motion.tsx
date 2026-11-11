import React from "react";

// The scene's looping motions (boats bobbing, the sea rolling, a flag fluttering), as SVG's
// own animations (SMIL) rather than CSS transforms: Chromium can composite CSS-transformed
// SVG parts as layers drawn at the SVG's unit scale and then stretched, which blurs them.
// SMIL redraws them as vectors, at full resolution. Nothing moves with reduced motion.

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EASE = { calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.42 0 0.58 1;0.42 0 0.58 1" } as const;

// Bobbing on the swell: up and down by `dy`, rocking by `deg` degrees about (cx, cy).
export const Bob: React.FC<{ delay?: number; dur?: number; dy?: number; deg?: number; cx?: number; cy?: number; children: React.ReactNode }> = ({
  delay = 0,
  dur = 5.5,
  dy = 5,
  deg = 1.4,
  cx = 0,
  cy = 0,
  children,
}) => {
  if (reduced()) return <g>{children}</g>;
  const timing = { dur: `${dur}s`, begin: `${-delay}s`, repeatCount: "indefinite", ...EASE };
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${dy};0 0`} {...timing} />
      <g>
        <animateTransform attributeName="transform" type="rotate" values={`${-deg} ${cx} ${cy};${deg} ${cx} ${cy};${-deg} ${cx} ${cy}`} {...timing} />
        {children}
      </g>
    </g>
  );
};

// Sliding along x, by `dx` over `dur` seconds: looping one way (`loop`), or there and back.
export const Slide: React.FC<{ dx: number; dur: number; loop?: boolean; opacity?: number; children: React.ReactNode }> = ({ dx, dur, loop = true, opacity, children }) => {
  if (reduced()) return <g opacity={opacity}>{children}</g>;
  return (
    <g opacity={opacity}>
      {loop ? (
        <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} 0`} dur={`${dur}s`} repeatCount="indefinite" />
      ) : (
        <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} 0;0 0`} dur={`${dur}s`} repeatCount="indefinite" {...EASE} />
      )}
      {children}
    </g>
  );
};

// A flag fluttering: skewed back and forth about its hoist (x, y).
export const Flutter: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => {
  if (reduced()) return <g>{children}</g>;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="skewY" values="0;3;0" dur="3s" repeatCount="indefinite" {...EASE} />
        <g transform={`translate(${-x} ${-y})`}>{children}</g>
      </g>
    </g>
  );
};
