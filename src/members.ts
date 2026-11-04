import { useEffect, useState } from "react";
import snapshot from "./data/members.snapshot.json";

// Open Collective members of the Free Explorers, one boat each. The boat's size follows the
// member's tier.
export const COLLECTIVE = "https://opencollective.com/free-explorers";
const MEMBERS_URL = `${COLLECTIVE}/members/all.json`;

export type Tier = "founder" | "yearly" | "monthly" | "once";
export const TIERS: { id: Tier; name: string; color: string }[] = [
  { id: "founder", name: "Founder Explorer", color: "#f9c46b" },
  { id: "yearly", name: "Yearly Explorer", color: "#cba6f7" },
  { id: "monthly", name: "Monthly Explorer", color: "#89dceb" },
  { id: "once", name: "One-time support", color: "#a6e3a1" },
];
const RANK: Record<Tier, number> = { founder: 3, yearly: 2, monthly: 1, once: 0 };
const tierOf = (name: string | null): Tier =>
  name === "Founder Explorer" ? "founder" : name === "Yearly Explorer" ? "yearly" : name === "Monthly Explorer" ? "monthly" : "once";

export type Member = {
  id: string;
  name: string;
  image: string | null;
  profile: string;
  tier: Tier;
  // Still contributing (former explorers sail on the horizon).
  active: boolean;
  total: number;
  currency: string;
};

type Raw = {
  type: string;
  role: string;
  tier: string | null;
  isActive: boolean;
  totalAmountDonated: number;
  currency: string | null;
  profile: string;
  name: string;
  image: string | null;
};

// One boat per person: backers only (not the host or the collective's own projects), with
// their best current tier (or best past tier for former explorers).
export const toMembers = (raw: Raw[]): Member[] => {
  const byProfile = new Map<string, Member>();
  for (const m of raw) {
    if (m.role !== "BACKER" || (m.type !== "USER" && m.type !== "ORGANIZATION")) continue;
    const next: Member = {
      id: m.profile,
      name: m.name,
      image: m.image ?? `https://images.opencollective.com/${m.profile.split("/").pop()}/avatar/128.png`,
      profile: m.profile,
      tier: tierOf(m.tier),
      active: m.isActive,
      total: m.totalAmountDonated ?? 0,
      currency: m.currency ?? "EUR",
    };
    const prev = byProfile.get(m.profile);
    if (!prev) {
      byProfile.set(m.profile, next);
      continue;
    }
    const better = next.active !== prev.active ? next.active : RANK[next.tier] > RANK[prev.tier];
    const merged = better ? next : prev;
    byProfile.set(m.profile, { ...merged, active: prev.active || next.active, total: Math.max(prev.total, next.total) });
  }
  return [...byProfile.values()].sort((a, b) => Number(b.active) - Number(a.active) || RANK[b.tier] - RANK[a.tier] || b.total - a.total);
};

// Starts from the bundled snapshot and swaps in the live list once it arrives.
export const useMembers = () => {
  const [members, setMembers] = useState(() => toMembers(snapshot as Raw[]));
  useEffect(() => {
    let alive = true;
    fetch(MEMBERS_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((raw: Raw[]) => alive && setMembers(toMembers(raw)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return members;
};
