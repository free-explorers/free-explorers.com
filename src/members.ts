import { useCallback, useEffect, useState } from "react";
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
// Starts from the bundled snapshot and swaps in the live list once it arrives. `refresh`
// fetches it again (after someone joins), past any cache.
export const useMembers = () => {
  const [members, setMembers] = useState(() => toMembers(snapshot as Raw[]));
  const refresh = useCallback(() => {
    fetch(`${MEMBERS_URL}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((raw: Raw[]) => setMembers(toMembers(raw)))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);
  return { members, refresh };
};

// What each tier costs and where its checkout is, read live from Open Collective (with the
// values as of writing as a fallback).
export type Offer = {
  tier: Tier;
  name: string;
  amount: number;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "ONETIME";
  // Whether contributors can pick their own amount (the amount is then a suggestion).
  flexible: boolean;
  // The tier's path segment in Open Collective URLs ("member-80808").
  path: string;
};
const OFFERS_FALLBACK: Offer[] = [
  { tier: "founder", name: "Founder Explorer", amount: 20, currency: "USD", frequency: "MONTHLY", flexible: false, path: "member-80808" },
  { tier: "yearly", name: "Yearly Explorer", amount: 50, currency: "USD", frequency: "YEARLY", flexible: true, path: "yearly-explorer-80806" },
  { tier: "monthly", name: "Monthly Explorer", amount: 10, currency: "USD", frequency: "MONTHLY", flexible: true, path: "flexible-80809" },
  { tier: "once", name: "One-time support", amount: 100, currency: "USD", frequency: "ONETIME", flexible: true, path: "one-time-support-80807" },
];
const TIERS_QUERY = `{ account(slug: "free-explorers") { ... on AccountWithContributions { tiers { nodes { name slug legacyId frequency amountType amount { value currency } } } } } }`;
type RawTier = { name: string; slug: string; legacyId: number; frequency: Offer["frequency"]; amountType: string; amount: { value: number; currency: string } };

export const useOffers = () => {
  const [offers, setOffers] = useState(OFFERS_FALLBACK);
  useEffect(() => {
    fetch("https://api.opencollective.com/graphql/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: TIERS_QUERY }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((res: { data: { account: { tiers: { nodes: RawTier[] } } } }) => {
        const live = res.data.account.tiers.nodes.map(
          (t): Offer => ({
            tier: t.frequency === "ONETIME" ? "once" : tierOf(t.name),
            name: t.name,
            amount: t.amount.value,
            currency: t.amount.currency,
            frequency: t.frequency,
            flexible: t.amountType === "FLEXIBLE",
            path: `${t.slug}-${t.legacyId}`,
          }),
        );
        const rank = (o: Offer) => TIERS.findIndex((t) => t.id === o.tier);
        if (live.length) setOffers(live.sort((a, b) => rank(a) - rank(b)));
      })
      .catch(() => {});
  }, []);
  return offers;
};

// The tier's checkout, embeddable in an iframe, without Open Collective's own header and FAQ.
export const checkoutUrl = (offer: Offer) => `https://opencollective.com/embed/free-explorers/contribute/${offer.path}?hideHeader=true&hideFAQ=true`;
export const checkoutPageUrl = (offer: Offer) => `${COLLECTIVE}/contribute/${offer.path}/checkout`;

export const formatPrice = (o: Offer) => {
  const money = new Intl.NumberFormat("en", { style: "currency", currency: o.currency, maximumFractionDigits: 0 }).format(o.amount);
  const per = o.frequency === "MONTHLY" ? " / month" : o.frequency === "YEARLY" ? " / year" : " once";
  return `${money}${per}`;
};
