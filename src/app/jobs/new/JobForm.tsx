"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TIMING_LABEL, isTiming, parseJob, type JobTiming } from "@/lib/jobs/rules";
import { JOB_RESUME_PATH, clearDraft, loadDraft, saveDraft, type JobDraft } from "@/lib/jobs/draft";
import { eventIdHeader, newEventId, track } from "@/lib/meta/pixel";

const sel = (err?: string) => `mt-1 w-full rounded-ctl border bg-white p-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 ${err ? "border-danger" : "border-line"}`;
const Err = ({ id, msg }: { id: string; msg?: string }) => (msg ? <p id={id} role="alert" className="mt-1 text-sm text-danger">{msg}</p> : null);

export function JobForm({ categories, states, initial, loggedIn }: { categories: { id: string; name: string }[]; states: string[]; initial: { categoryId: string; state: string }; loggedIn: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [timing, setTiming] = useState<JobTiming>("THIS_WEEK");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  // A job typed before signing up comes back here after sign-up/login. The form is remounted with it
  // as its starting values (the fields are uncontrolled), and nothing is posted until they tap Post.
  const [draft, setDraft] = useState<JobDraft | null>(null);
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    setDraft(d);
    const t: unknown = d.timing;
    if (isTiming(t)) setTiming(t);
  }, []);
  const dv = (name: string, fallback = "") => draft?.[name] ?? fallback;
  const loginNext = `/login?next=${encodeURIComponent(JOB_RESUME_PATH)}`;
  const keepTyped = (form: HTMLFormElement | null) => {
    if (!form) return;
    const raw: Record<string, string> = {};
    new FormData(form).forEach((v, k) => { raw[k] = String(v); });
    raw.timing = timing;
    saveDraft(raw);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw: Record<string, string> = {};
    new FormData(e.currentTarget).forEach((v, k) => { raw[k] = String(v); });
    raw.timing = timing;
    const check = parseJob(raw, states);
    if (!check.ok) { setErrors(check.errors); document.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.scrollIntoView({ block: "center" }); return; }
    setErrors({});
    if (!loggedIn) {
      // Keep what they typed, then ask for an account. They come back to this form, filled in.
      saveDraft(raw);
      router.push(`/register?next=${encodeURIComponent(JOB_RESUME_PATH)}`);
      return;
    }
    setBusy(true);
    try {
      const eventId = newEventId("job");
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json", ...eventIdHeader(eventId) }, body: JSON.stringify(raw) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ?? { form: data.error ?? "Couldn't post your job. Try again." });
      clearDraft();
      track("Lead", { content_name: "job_post", content_category: categories.find((c) => c.id === raw.categoryId)?.name, city: raw.state }, eventId);
      router.push(`/jobs/${data.id}?posted=${data.notified ?? 0}`);
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form key={draft ? "draft" : "blank"} onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      {draft && loggedIn && <Alert variant="info" title="Your job is filled in">Check the details, then tap Post job to send it to artisans.</Alert>}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium">What service do you need?</label>
        <select id="categoryId" name="categoryId" defaultValue={dv("categoryId", initial.categoryId)} aria-invalid={!!errors.categoryId} aria-describedby="categoryId-err" className={sel(errors.categoryId)}>
          <option value="" disabled>Choose a service</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Err id="categoryId-err" msg={errors.categoryId} />
      </div>
      <Input label="Job title" name="title" defaultValue={dv("title")} maxLength={80} placeholder="e.g. Fix leaking kitchen sink" error={errors.title} />
      <Textarea label="Describe the job" name="description" defaultValue={dv("description")} maxLength={1500} rows={5} error={errors.description}
        hint="What needs doing, how big it is, and anything the artisan should bring. Don't add phone numbers: you'll get the artisan's contact when you hire." />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="state" className="block text-sm font-medium">State</label>
          <select id="state" name="state" defaultValue={dv("state", initial.state)} aria-invalid={!!errors.state} aria-describedby="state-err" className={sel(errors.state)}>
            <option value="" disabled>Choose</option>
            {states.map((s) => <option key={s} value={s}>{s === "FCT (Abuja)" ? "Abuja (FCT)" : s}</option>)}
          </select>
          <Err id="state-err" msg={errors.state} />
        </div>
        <Input label="Area / LGA" name="lga" defaultValue={dv("lga")} maxLength={60} placeholder="e.g. Ikeja" error={errors.lga} />
      </div>
      <p className="-mt-3 text-xs text-muted">Only your area is shown to artisans. Share the exact address with the person you hire.</p>

      <fieldset>
        <legend className="text-sm font-medium">Budget <span className="font-normal text-muted">(optional)</span></legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <Input label="From (₦)" name="budgetMinNaira" defaultValue={dv("budgetMinNaira")} inputMode="numeric" placeholder="5,000" error={errors.budgetMinNaira} />
          <Input label="To (₦)" name="budgetMaxNaira" defaultValue={dv("budgetMaxNaira")} inputMode="numeric" placeholder="20,000" error={errors.budgetMaxNaira} />
        </div>
        <p className="mt-1 text-xs text-muted">Not sure? Leave it empty and let the quotes tell you.</p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">When do you need it?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(TIMING_LABEL) as JobTiming[]).map((t) => (
            <label key={t} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-ctl border px-3 text-center text-sm font-medium ${timing === t ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"}`}>
              <input type="radio" name="timingChoice" value={t} checked={timing === t} onChange={() => setTiming(t)} className="sr-only" />
              {TIMING_LABEL[t]}
            </label>
          ))}
        </div>
        <Err id="timing-err" msg={errors.timing} />
        {timing === "ON_DATE" && <div className="mt-3"><Input label="Date" name="preferredDate" type="date" defaultValue={dv("preferredDate")} min={today} error={errors.preferredDate} /></div>}
      </fieldset>

      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button type="submit" loading={busy} className="w-full">{loggedIn ? "Post job and get quotes" : "Continue: post my job free"}</Button>
      {!loggedIn && (
        <p className="text-center text-sm text-muted">
          Next you&apos;ll create a free account so artisans can reply to you. It takes a minute and your job is kept.{" "}
          Already have an account? <Link href={loginNext} onClick={(e) => keepTyped(e.currentTarget.closest("form"))} className="font-semibold text-brand underline">Log in</Link>
        </p>
      )}
      <p className="text-center text-xs text-muted">Artisans who offer this service in your state will be notified. Your job stays open for 14 days.</p>
    </form>
  );
}
