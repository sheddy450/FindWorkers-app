import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { ProfileForm } from "./ProfileForm";

export default async function ArtisanProfile() {
  const user = await requirePageRole("ARTISAN");
  const [categories, a] = await Promise.all([
    db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.artisan.findUnique({ where: { userId: user.id }, include: { services: { select: { categoryId: true } } } }),
  ]);
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold text-brand">{a ? "Your profile" : "Set up your profile"}</h1>
      <p className="mt-1 text-muted">Customers see this before they contact you.</p>
      <ProfileForm isNew={!a} categories={categories} initial={{
        businessName: a?.businessName ?? user.name, bio: a?.bio ?? "", yearsExperience: a?.yearsExperience ?? 0,
        categoryIds: a?.services.map((s) => s.categoryId) ?? [], state: a?.state ?? "", lga: a?.lga ?? "", serviceRadiusKm: a?.serviceRadiusKm ?? 10,
        priceMinNaira: a?.priceMinKobo != null ? a.priceMinKobo / 100 : undefined, priceMaxNaira: a?.priceMaxKobo != null ? a.priceMaxKobo / 100 : undefined,
        availability: a?.availability ?? "BY_SCHEDULE" }} />
    </main>
  );
}
