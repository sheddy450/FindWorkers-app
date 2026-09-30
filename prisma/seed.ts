import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
const db = new PrismaClient();
const categories = [
  ["plumber","Plumber"],["electrician","Electrician"],["generator-repair","Generator repair"],
  ["ac-fridge","AC & fridge technician"],["carpenter","Carpenter"],["painter","Painter"],
  ["tiler","Tiler"],["mechanic","Mechanic"],["cleaner","Cleaner"],["tailor","Tailor"],
  ["phone-laptop-repair","Phone & laptop repair"],["appliance-repair","Appliance repair"],
];
async function main() {
  for (const [slug, name] of categories)
    await db.serviceCategory.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  const email = process.env.SEED_ADMIN_EMAIL, pw = process.env.SEED_ADMIN_PASSWORD;
  if (email && pw && pw.length >= 12)
    await db.user.upsert({ where: { email }, update: {},
      create: { email, name: "Platform Admin", role: "ADMIN", passwordHash: await hash(pw) } });
  else console.log("Skipped admin seed: set SEED_ADMIN_EMAIL and a 12+ char SEED_ADMIN_PASSWORD.");
  // No fake artisans or reviews are seeded on purpose.
}
main().finally(() => db.$disconnect());
