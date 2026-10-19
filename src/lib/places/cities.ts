/**
 * Major Nigerian cities for "browse by city" and the home page search. Artisans record their STATE
 * (and LGA), so each city maps to its state: the listing pages are state pages, labelled honestly.
 */
export type City = { name: string; slug: string; state: string };

export const CITIES: City[] = [
  { name: "Lagos", slug: "lagos", state: "Lagos" },
  { name: "Abuja", slug: "abuja", state: "FCT (Abuja)" },
  { name: "Port Harcourt", slug: "port-harcourt", state: "Rivers" },
  { name: "Ibadan", slug: "ibadan", state: "Oyo" },
  { name: "Kano", slug: "kano", state: "Kano" },
  { name: "Benin City", slug: "benin-city", state: "Edo" },
  { name: "Enugu", slug: "enugu", state: "Enugu" },
  { name: "Kaduna", slug: "kaduna", state: "Kaduna" },
  { name: "Jos", slug: "jos", state: "Plateau" },
  { name: "Abeokuta", slug: "abeokuta", state: "Ogun" },
  { name: "Owerri", slug: "owerri", state: "Imo" },
  { name: "Uyo", slug: "uyo", state: "Akwa Ibom" },
  { name: "Calabar", slug: "calabar", state: "Cross River" },
  { name: "Warri", slug: "warri", state: "Delta" },
  { name: "Ilorin", slug: "ilorin", state: "Kwara" },
  { name: "Onitsha", slug: "onitsha", state: "Anambra" },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Finds a city by slug or name ("port-harcourt", "Port Harcourt", "PH"? no: only real names),
 * or a state by name ("Rivers"), so /browse?city=… accepts what people naturally type.
 */
export function cityOrState(input: string | null | undefined, states: readonly string[]): { label: string; state: string } | null {
  if (!input) return null;
  const k = norm(input);
  const city = CITIES.find((c) => c.slug === k || norm(c.name) === k);
  if (city) return { label: city.name, state: city.state };
  const state = states.find((s) => norm(s) === k || norm(s.replace(/\s*\(.*\)/, "")) === k);
  return state ? { label: state === "FCT (Abuja)" ? "Abuja" : state, state } : null;
}
