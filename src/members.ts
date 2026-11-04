import { useCallback, useEffect, useState } from "react";
import snapshot from "./data/members.snapshot.json";
import ordersSnapshot from "./data/orders.snapshot.json";

// Open Collective members of the Free Explorers, one boat each. The boat follows how much
// the member gives: a dinghy, a sloop, a brigantine, or a galleon for enterprise sponsors.
export const COLLECTIVE = "https://opencollective.com/free-explorers";
// Preview with another collective's members (`?collective=webpack`), for testing the sea with
// a big fleet. Links and the checkout stay the Free Explorers'.
const PREVIEW = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("collective")?.replace(/[^a-z0-9-]/gi, "") || null : null;
const SLUG = PREVIEW ?? "free-explorers";
const MEMBERS_URL = `https://opencollective.com/${SLUG}/members/all.json`;

export type BoatKind = "dinghy" | "sloop" | "brig" | "galleon";
// Amounts are per month (a yearly contribution counts for a twelfth of it); `max` null is open.
export const BOATS: { id: BoatKind; name: string; range: string; min: number; max: number | null; color: string }[] = [
  { id: "galleon", name: "Galleon", range: "$500+", min: 500, max: null, color: "#f9c46b" },
  { id: "brig", name: "Brigantine", range: "$50–400", min: 50, max: 400, color: "#cba6f7" },
  { id: "sloop", name: "Sloop", range: "$10–40", min: 10, max: 40, color: "#89dceb" },
  { id: "dinghy", name: "Dinghy", range: "$1–5", min: 1, max: 5, color: "#a6e3a1" },
];
export const boatInfo = (id: BoatKind) => BOATS.find((b) => b.id === id)!;
const RANK: Record<BoatKind, number> = { galleon: 3, brig: 2, sloop: 1, dinghy: 0 };
// How big a boat is within its kind, from what's given per month: 0.85 at the bottom of its
// range up to 1.15 at the top (the galleon's at $5,000), on a log scale so the first dollars
// count most. The biggest of a kind stays smaller than the smallest of the next.
const SIZE_BANDS: [number, number][] = [
  [1, 10],
  [10, 50],
  [50, 500],
  [500, 5000],
];
export const sizeWithin = (amount: number) => {
  const [lo, hi] = SIZE_BANDS.find(([, top], i) => amount < top || i === SIZE_BANDS.length - 1)!;
  const t = Math.min(1, Math.max(0, Math.log(Math.max(amount, lo) / lo) / Math.log(hi / lo)));
  return 0.85 + 0.3 * t;
};

// The boat for a contribution per month (or a one-time gift): amounts between the slider's
// ranges go to the smaller boat.
export const boatFor = (amount: number): BoatKind => (amount >= 500 ? "galleon" : amount >= 50 ? "brig" : amount >= 10 ? "sloop" : "dinghy");

export type Member = {
  id: string;
  name: string;
  image: string | null;
  profile: string;
  boat: BoatKind;
  // What they give per month (a yearly contribution counts for a twelfth, a one-time gift as
  // is), which sets the boat.
  amount: number;
  // Sailing on the surface: an active monthly or yearly contribution. One-time donors and
  // former monthly/yearly donors cruise below in submarines.
  active: boolean;
  // All they've given, which sizes their submarine.
  total: number;
  currency: string;
};

type Raw = {
  type: string;
  role: string;
  isActive: boolean;
  lastTransactionAmount?: number | null;
  totalAmountDonated?: number | null;
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
      // Only a picture or logo the member uploaded (not Open Collective's generated initials).
      image: m.image ?? null,
      profile: m.profile,
      boat: boatFor(amount),
      amount,
      active: m.isActive,
      total: m.totalAmountDonated ?? 0,
      currency: m.currency ?? "USD",
    };
    const prev = byProfile.get(m.profile);
    if (!prev) {
      byProfile.set(m.profile, next);
      continue;
    }
    const better = next.active !== prev.active ? next.active : next.amount > prev.amount;
    byProfile.set(m.profile, { ...(better ? next : prev), active: prev.active || next.active, total: Math.max(prev.total, next.total) });
  }
  return [...byProfile.values()].sort((a, b) => Number(b.active) - Number(a.active) || RANK[b.boat] - RANK[a.boat] || b.amount - a.amount);
};

// What each contributor gives per month, from the collective's contributions (newest first):
// their active recurring contribution if any, else their latest paid one; yearly counts for
// a twelfth. Keyed by profile slug.
type Order = { status: string; frequency: "MONTHLY" | "YEARLY" | "ONETIME"; amount: { value: number }; fromAccount: { slug: string } };
// Only the active contributions (monthly/yearly, and some one-time ones still processing),
// all of them, page by page: a big collective's newest contributions don't include the
// monthly donations started long ago.
const ordersQuery = (offset: number) =>
  `{ account(slug: "${SLUG}") { orders(filter: INCOMING, status: [ACTIVE], limit: 1000, offset: ${offset}) { totalCount nodes { status frequency amount { value } fromAccount { slug } } } } }`;
const perMonth = (o: Order) => (o.frequency === "YEARLY" ? o.amount.value / 12 : o.amount.value);
// Per contributor (profile slug): their active monthly/yearly contribution per month, if any,
// and their latest paid contribution otherwise.
const contributions = (orders: Order[]) => {
  const recurring = new Map<string, number>();
  const last = new Map<string, number>();
  for (const o of orders) if (o.status === "ACTIVE" && o.frequency !== "ONETIME" && !recurring.has(o.fromAccount.slug)) recurring.set(o.fromAccount.slug, perMonth(o));
  for (const o of orders) if (["PAID", "ACTIVE", "CANCELLED", "EXPIRED"].includes(o.status) && !last.has(o.fromAccount.slug)) last.set(o.fromAccount.slug, perMonth(o));
  return { recurring, last, known: orders.length > 0 };
};
type OrdersPage = { data?: { account?: { orders?: { totalCount: number; nodes: Order[] } } } };
const fetchOrdersPage = (offset: number) =>
  fetch("https://api.opencollective.com/graphql/v2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: ordersQuery(offset) }) })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((res: OrdersPage) => res.data?.account?.orders ?? Promise.reject("no orders"));
const fetchOrdersOnce = async (): Promise<Order[]> => {
  const all: Order[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await fetchOrdersPage(offset);
    all.push(...page.nodes);
    if (all.length >= page.totalCount || page.nodes.length === 0) return all;
  }
};
// Retried a few times (Open Collective limits frequent requests): a failure must not be
// taken for "nobody gives monthly", which would send everyone below.
const fetchOrders = async (): Promise<Order[]> => {
  for (let i = 0; ; i++) {
    try {
      return await fetchOrdersOnce();
    } catch (e) {
      if (i >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
};

// Members from the contributions: on the surface only with an active monthly/yearly one (its
// amount per month sets the boat); everyone else below. Left as the member list says if the
// contributions can't be read.
const withContributions = (members: Member[], orders: Order[], complete = false) => {
  const c = contributions(orders);
  // With a complete list of active contributions, none means nobody gives monthly.
  if (!c.known && !complete) return members;
  return members.map((m) => {
    const slug = m.profile.split("/").pop()!;
    const monthly = c.recurring.get(slug);
    if (monthly !== undefined) return { ...m, active: true, amount: monthly, boat: boatFor(monthly) };
    const amount = c.last.get(slug) ?? m.amount;
    return { ...m, active: false, amount, boat: boatFor(amount) };
  });
};

// The whole member list, page by page (Open Collective serves 1,000 at a time), up to a cap.
const MAX_MEMBERS = 10000;
const fetchMemberList = async (): Promise<Raw[]> => {
  const all: Raw[] = [];
  const stamp = Date.now();
  for (let offset = 0; offset < MAX_MEMBERS; offset += 1000) {
    const r = await fetch(`${MEMBERS_URL}?limit=1000&offset=${offset}&t=${stamp}`);
    if (!r.ok) throw r.status;
    const page: Raw[] = await r.json();
    all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
};

// Starts from the bundled snapshot and swaps in the live list once it arrives. `refresh`
// fetches it again (after someone joins), past any cache.
export const useMembers = () => {
  const [members, setMembers] = useState(() => (PREVIEW ? [] : withContributions(toMembers(snapshot as Raw[]), ordersSnapshot as Order[])));
  const refresh = useCallback(() => {
    const list = fetchMemberList();
    // Both are needed to tell boats from submarines: if either fails, the current fleet stays
    // (the bundled snapshot at first) rather than everyone turning into boats or submarines.
    Promise.all([list, fetchOrders()])
      .then(([raw, orders]: [Raw[], Order[]]) => setMembers(withContributions(toMembers(raw), orders, true)))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);
  return { members, refresh };
};

// The join slider's amounts: $1 steps to 5, then 10, $5 steps to 30, $10 to 100, $100 to
// 400, then $500 steps to 5,000 (enterprise sponsors).
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
export const AMOUNTS = [...range(1, 5, 1), 10, ...range(15, 30, 5), ...range(40, 100, 10), ...range(200, 400, 100), ...range(500, 5000, 500)];

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

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
export const perLabel = (frequency: Frequency) => (frequency === "month" ? "/ month" : frequency === "year" ? "/ year" : "once");
