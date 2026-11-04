import { useCallback, useEffect, useState } from "react";
import snapshot from "./data/members.snapshot.json";

// Open Collective members of the Free Explorers, one boat each. The boat follows how much
// the member gives: a dinghy, a sloop, a brigantine, or a galleon for enterprise sponsors.
export const COLLECTIVE = "https://opencollective.com/free-explorers";
const MEMBERS_URL = `${COLLECTIVE}/members/all.json`;

export type BoatKind = "dinghy" | "sloop" | "brig" | "galleon";
// Amounts are per month (a yearly contribution counts for a twelfth of it); `max` null is open.
export const BOATS: { id: BoatKind; name: string; range: string; min: number; max: number | null; color: string }[] = [
  { id: "galleon", name: "Galleon", range: "$500+", min: 500, max: null, color: "#f9c46b" },
  { id: "brig", name: "Brigantine", range: "$50–450", min: 50, max: 450, color: "#cba6f7" },
  { id: "sloop", name: "Sloop", range: "$15–40", min: 15, max: 40, color: "#89dceb" },
  { id: "dinghy", name: "Dinghy", range: "$1–10", min: 1, max: 10, color: "#a6e3a1" },
];
export const boatInfo = (id: BoatKind) => BOATS.find((b) => b.id === id)!;
const RANK: Record<BoatKind, number> = { galleon: 3, brig: 2, sloop: 1, dinghy: 0 };
// The boat for a contribution per month (or a one-time gift): amounts between the slider's
// ranges go to the smaller boat.
export const boatFor = (amount: number): BoatKind => (amount >= 500 ? "galleon" : amount >= 50 ? "brig" : amount >= 15 ? "sloop" : "dinghy");

export type Member = {
  id: string;
  name: string;
  image: string | null;
  profile: string;
  boat: BoatKind;
  // What they give per month (a yearly contribution counts for a twelfth, a one-time gift as
  // is), which sets the boat.
  amount: number;
  // Still contributing (former explorers sail on the horizon).
  active: boolean;
  currency: string;
};

type Raw = {
  type: string;
  role: string;
  isActive: boolean;
  lastTransactionAmount?: number | null;
  currency: string | null;
  profile: string;
  name: string;
  image: string | null;
};

// One boat per person: backers only (not the host or the collective's own projects). A
// person listed twice keeps their active entry, else their bigger contribution.
export const toMembers = (raw: Raw[]): Member[] => {
  const byProfile = new Map<string, Member>();
  for (const m of raw) {
    if (m.role !== "BACKER" || (m.type !== "USER" && m.type !== "ORGANIZATION")) continue;
    const amount = m.lastTransactionAmount ?? 0;
    const next: Member = {
      id: m.profile,
      name: m.name,
      image: m.image ?? `https://images.opencollective.com/${m.profile.split("/").pop()}/avatar/128.png`,
      profile: m.profile,
      boat: boatFor(amount),
      amount,
      active: m.isActive,
      currency: m.currency ?? "USD",
    };
    const prev = byProfile.get(m.profile);
    if (!prev) {
      byProfile.set(m.profile, next);
      continue;
    }
    const better = next.active !== prev.active ? next.active : next.amount > prev.amount;
    byProfile.set(m.profile, { ...(better ? next : prev), active: prev.active || next.active });
  }
  return [...byProfile.values()].sort((a, b) => Number(b.active) - Number(a.active) || RANK[b.boat] - RANK[a.boat] || b.amount - a.amount);
};

// What each contributor gives per month, from the collective's contributions (newest first):
// their active recurring contribution if any, else their latest paid one; yearly counts for
// a twelfth. Keyed by profile slug.
type Order = { status: string; frequency: "MONTHLY" | "YEARLY" | "ONETIME"; amount: { value: number }; fromAccount: { slug: string } };
const ORDERS_QUERY = `{ account(slug: "free-explorers") { orders(filter: INCOMING, limit: 1000) { nodes { status frequency amount { value } fromAccount { slug } } } } }`;
const perMonth = (o: Order) => (o.frequency === "YEARLY" ? o.amount.value / 12 : o.amount.value);
const monthlyAmounts = (orders: Order[]) => {
  const out = new Map<string, number>();
  for (const o of orders) if (o.status === "ACTIVE" && o.frequency !== "ONETIME" && !out.has(o.fromAccount.slug)) out.set(o.fromAccount.slug, perMonth(o));
  for (const o of orders) if (["PAID", "ACTIVE", "CANCELLED", "EXPIRED"].includes(o.status) && !out.has(o.fromAccount.slug)) out.set(o.fromAccount.slug, perMonth(o));
  return out;
};
const fetchOrders = (): Promise<Order[]> =>
  fetch("https://api.opencollective.com/graphql/v2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: ORDERS_QUERY }) })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((res: { data: { account: { orders: { nodes: Order[] } } } }) => res.data.account.orders.nodes);

// Members with their boat from what they give per month (the last contribution's amount if
// the contributions can't be read).
const withMonthly = (members: Member[], monthly: Map<string, number>) =>
  members.map((m) => {
    const amount = monthly.get(m.profile.split("/").pop()!);
    return amount === undefined ? m : { ...m, amount, boat: boatFor(amount) };
  });

// Starts from the bundled snapshot and swaps in the live list once it arrives. `refresh`
// fetches it again (after someone joins), past any cache.
export const useMembers = () => {
  const [members, setMembers] = useState(() => toMembers(snapshot as Raw[]));
  const refresh = useCallback(() => {
    const list = fetch(`${MEMBERS_URL}?t=${Date.now()}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    Promise.all([list, fetchOrders().catch(() => [] as Order[])])
      .then(([raw, orders]: [Raw[], Order[]]) => setMembers(withMonthly(toMembers(raw), monthlyAmounts(orders))))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);
  return { members, refresh };
};

// The join slider's amounts: $1 steps to 10, $5 to 30, $10 to 100, $50 to 450, then $500
// steps to 5,000 (enterprise sponsors).
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
export const AMOUNTS = [...range(1, 10, 1), ...range(15, 30, 5), ...range(40, 100, 10), ...range(150, 450, 50), ...range(500, 5000, 500)];

export type Frequency = "month" | "year" | "once";
export const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
  { id: "once", label: "Once" },
];

// Open Collective's checkout for an amount and frequency (in dollars, the collective's
// currency): embeddable in an iframe, without its own header and FAQ, or as a page.
const checkoutQuery = (amount: number, frequency: Frequency) => `amount=${amount}${frequency === "once" ? "" : `&interval=${frequency}`}`;
export const checkoutUrl = (amount: number, frequency: Frequency) =>
  `https://opencollective.com/embed/free-explorers/donate?${checkoutQuery(amount, frequency)}&hideHeader=true&hideFAQ=true`;
export const checkoutPageUrl = (amount: number, frequency: Frequency) => `${COLLECTIVE}/donate?${checkoutQuery(amount, frequency)}`;

// The slider's amounts are per month: yearly contributions are twelve times them.
export const multiplier = (frequency: Frequency) => (frequency === "year" ? 12 : 1);
// A boat's range for a frequency, e.g. "$180–480" for a yearly sloop.
export const rangeLabel = (boat: (typeof BOATS)[number], frequency: Frequency) => {
  const k = multiplier(frequency);
  return boat.max === null ? `${formatAmount(boat.min * k)}+` : `${formatAmount(boat.min * k)}–${formatAmount(boat.max * k).replace("$", "")}`;
};

export const formatAmount = (amount: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
export const perLabel = (frequency: Frequency) => (frequency === "month" ? "/ month" : frequency === "year" ? "/ year" : "once");
