"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { parseGuide } from "@/lib/guides/rules";

type Initial = { title: string; slug: string; summary: string; categoryId: string; audience: "CUSTOMER" | "ARTISAN"; body: string; prices: string;
  pricesNote: string; questions: string; redFlags: string; checklist: string; published: boolean };

const sel = "mt-1 w-full rounded-ctl border border-line bg-white p-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";
const mono = "font-mono text-sm";

export function GuideEditor({ id, categories, initial }: { id: string | null; categories: { id: string; name: string }[]; initial: Initial }) {
  const router = useRouter(); const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false), [confirmDelete, setConfirmDelete] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const raw: Record<string, string | boolean> = {};
    new FormData(e.currentTarget).forEach((v, k) => { raw[k] = String(v); });
    raw.publish = submitter?.value === "publish";
    const check = parseGuide(raw);
    if (!check.ok) { setErrors(check.errors); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch(id ? `/api/admin/guides/${id}` : "/api/admin/guides", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(raw) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErrors(data.errors ?? { form: data.error ?? "Couldn't save the guide." }); return; }
      toast("success", raw.publish ? "Saved and published." : "Saved as a draft.");
      if (!id) router.replace(`/admin/guides/${data.id}`); else router.refresh();
    } catch { setErrors({ form: "Couldn't reach the server." }); } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/admin/guides/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast("error", "Couldn't delete the guide.");
    toast("success", "Guide deleted."); router.push("/admin/guides"); router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      {errors.form && <Alert variant="error" title={errors.form} />}
      {Object.keys(errors).length > 0 && !errors.form && <Alert variant="error" title="Please fix the highlighted fields." />}
      <Input label="Title" name="title" defaultValue={initial.title} maxLength={100} error={errors.title} />
      <Input label="Web address (slug)" name="slug" defaultValue={initial.slug} error={errors.slug} hint="Leave empty to make one from the title. Changing it breaks old links." />
      <Textarea label="Summary" name="summary" defaultValue={initial.summary} rows={2} maxLength={240} error={errors.summary} hint="Shows on guide cards and in Google results." />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium">Service</label>
          <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} className={sel}>
            <option value="">General (no service)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <p role="alert" className="mt-1 text-sm text-danger">{errors.categoryId}</p>}
        </div>
        <div>
          <label htmlFor="audience" className="block text-sm font-medium">Written for</label>
          <select id="audience" name="audience" defaultValue={initial.audience} className={sel}>
            <option value="CUSTOMER">Customers</option><option value="ARTISAN">Artisans</option>
          </select>
        </div>
      </div>
      <Textarea label="Guide text" name="body" defaultValue={initial.body} rows={18} className={mono} error={errors.body}
        hint={'Start a section with "## Heading". Start list lines with "- ". Leave a blank line between paragraphs. **Two stars** make text bold.'} />
      <Textarea label="Price table" name="prices" defaultValue={initial.prices} rows={7} className={mono} error={errors.prices}
        hint={'One line per job: What | lowest ₦ | highest ₦ | note (optional). Example: Fix a leaking tap | 5,000 | 15,000 | parts extra'} />
      <Input label="Price note" name="pricesNote" defaultValue={initial.pricesNote} error={errors.pricesNote} hint="Where and when the prices apply. Shown with the table, which is always labelled as estimates." />
      <Textarea label="Questions to ask" name="questions" defaultValue={initial.questions} rows={5} error={errors.questions} hint="One per line." />
      <Textarea label="Red flags" name="redFlags" defaultValue={initial.redFlags} rows={4} error={errors.redFlags} hint="One per line." />
      <Textarea label="Checklist" name="checklist" defaultValue={initial.checklist} rows={5} error={errors.checklist} hint="One per line." />

      <div className="sticky bottom-20 z-10 flex flex-wrap gap-2 rounded-[18px] bg-white/95 p-3 shadow-soft ring-1 ring-line backdrop-blur md:bottom-4">
        <Button type="submit" name="action" value="publish" loading={busy}>{initial.published ? "Save (live)" : "Publish"}</Button>
        <Button type="submit" name="action" value="draft" variant="outline" disabled={busy}>{initial.published ? "Unpublish (draft)" : "Save draft"}</Button>
        {id && initial.slug && <a href={`/guides/${initial.slug}?preview=1`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-ctl px-3 font-semibold text-brand underline">Preview</a>}
        {id && (confirmDelete
          ? <span className="ml-auto flex gap-2"><Button type="button" variant="danger" onClick={remove} disabled={busy}>Delete for good</Button><Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Keep</Button></span>
          : <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto text-sm font-medium text-danger underline">Delete</button>)}
      </div>
    </form>
  );
}
