import type { Role } from "@prisma/client";
export const routeRoles: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/artisan", roles: ["ARTISAN"] },
  { prefix: "/requests", roles: ["CUSTOMER", "ARTISAN", "ADMIN"] },
  { prefix: "/messages", roles: ["CUSTOMER", "ARTISAN"] },
  { prefix: "/profile", roles: ["CUSTOMER", "ARTISAN", "ADMIN"] },
];
export function allowed(path: string, role?: Role) {
  const rule = routeRoles.find((r) => path.startsWith(r.prefix));
  return !rule || (!!role && rule.roles.includes(role));
}
/** Service-layer guard: middleware is not enough, always check ownership too. */
export function assertOwner(actorId: string, ownerId: string, role?: Role) {
  if (actorId !== ownerId && role !== "ADMIN") throw new Error("FORBIDDEN");
}
