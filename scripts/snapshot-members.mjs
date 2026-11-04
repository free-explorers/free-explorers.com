// Saves a snapshot of the Open Collective members, used when the live fetch fails.
// Only public profile fields are kept.
import { writeFileSync } from "node:fs";
const res = await fetch("https://opencollective.com/free-explorers/members/all.json");
const all = await res.json();
const keep = ["MemberId", "createdAt", "type", "role", "tier", "isActive", "lastTransactionAmount", "totalAmountDonated", "currency", "profile", "name", "image"];
const members = all.map((m) => Object.fromEntries(keep.map((k) => [k, m[k] ?? null])));
writeFileSync("src/data/members.snapshot.json", JSON.stringify(members, null, 2) + "\n");
console.log(`${members.length} members saved`);

// The contributions too (who gives monthly/yearly now), so the first render is right.
const q = `{ account(slug: "free-explorers") { orders(filter: INCOMING, limit: 1000) { nodes { status frequency amount { value } fromAccount { slug } } } } }`;
const orders = await (await fetch("https://api.opencollective.com/graphql/v2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) })).json();
writeFileSync("src/data/orders.snapshot.json", JSON.stringify(orders.data.account.orders.nodes, null, 2) + "\n");
console.log(`${orders.data.account.orders.nodes.length} contributions saved`);
