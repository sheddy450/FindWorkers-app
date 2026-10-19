import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { NIGERIA_STATES } from "@/lib/validation/artisan";
import { JobForm } from "./JobForm";

export const metadata = { title: "Post a job" };

export default async function NewJob({ searchParams }: { searchParams: Promise<{ service?: string; state?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/jobs/new");
  if (user.role === "ARTISAN") redirect("/jobs");
  if (user.role !== "CUSTOMER") redirect("/");
  const sp = await searchParams;
  const categories = await db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
  const pre = categories.find((c) => c.slug === sp.service)?.id ?? "";
  const state = NIGERIA_STATES.find((s) => s.toLowerCase() === (sp.state ?? "").toLowerCase()) ?? "";
  return (
    <main className="mx-auto max-w-md p-6 pb-28">
      <h1 className="text-3xl font-bold text-brand">Post a job</h1>
      <p className="mt-1 text-muted">It&apos;s free. Artisans near you send quotes, you compare them and hire the one you like.</p>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium text-muted">
        {["Describe the job", "Get quotes", "Hire & review"].map((s, i) => (
          <li key={s} className="rounded-ctl bg-white p-2 shadow-soft"><span className="mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full bg-brand text-white">{i + 1}</span>{s}</li>
        ))}
      </ol>
      <JobForm categories={categories.map(({ id, name }) => ({ id, name }))} states={[...NIGERIA_STATES]} initial={{ categoryId: pre, state }} />
    </main>
  );
}
