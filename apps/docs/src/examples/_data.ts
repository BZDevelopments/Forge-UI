// Deterministic sample data for the docs. Not part of the library.
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const first = [
  "Ada",
  "Grace",
  "Linus",
  "Margaret",
  "Alan",
  "Barbara",
  "Dennis",
  "Radia",
  "Ken",
  "Frances",
  "Tim",
  "Hedy",
];
const last = [
  "Lovelace",
  "Hopper",
  "Torvalds",
  "Hamilton",
  "Turing",
  "Liskov",
  "Ritchie",
  "Perlman",
  "Thompson",
  "Allen",
  "Berners-Lee",
  "Lamarr",
];
const plans = ["Free", "Pro", "Team", "Enterprise"] as const;
const statuses = ["active", "trial", "churned"] as const;

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: (typeof plans)[number];
  status: (typeof statuses)[number];
  mrr: number;
  joined: string;
}

export function makeCustomers(count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => {
    const name = `${first[i % first.length]} ${last[(i * 7 + Math.floor(i / 12)) % last.length]}`;
    const plan = plans[(i * 3) % plans.length]!;
    return {
      id: `cus_${String(i + 1).padStart(5, "0")}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i}@example.com`,
      plan,
      status: statuses[(i * 5) % statuses.length]!,
      mrr: plan === "Free" ? 0 : plans.indexOf(plan) * 29 + (i % 7) * 3,
      joined: new Date(2022, i % 12, (i % 27) + 1).toISOString().slice(0, 10),
    };
  });
}
