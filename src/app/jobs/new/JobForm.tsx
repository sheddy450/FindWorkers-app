"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TIMING_LABEL, parseJob, type JobTiming } from "@/lib/jobs/rules";

const sel = (err?: string) => `mt-1 w-full rounded-ctl border bg-white p-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 ${err ? "border-danger" : "border-line"}`;
const Err = ({ id, msg }: { id: string; msg?: string }) => (msg ? <p id={id} role="alert" className="mt-1 text-sm text-danger">{msg}</p> : null);

export function JobForm({ categories, states, initial }: { categories: { id: string; name: string }[]; states: string[]; initial: { categoryId: string; state: string } }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [timing, setTiming] = useState<JobTiming>("THIS_WEEK");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    raw.timing = timing;
    const check = parseJob(raw, states);
    if (!check.ok) { setErrors(check.errors); document.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.scrollIntoView({ block: "center" }); return; }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(raw) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ?? { form: data.error ?? "Couldn't post your job. Try again." });
      router.push(`/jobs/${data.id}?posted=${data.notified ?? 0}`);
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium">What service do you need?</label>
        <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} aria-invalid={!!errors.categoryId} aria-describedby="categoryId-err" className={sel(errors.categoryId)}>
          <option value="" disabled>Choose a service</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Err id="categoryId-err" msg={errors.categoryId} />
      </div>
      <Input label="Job title" name="title" maxLength={80} placeholder="e.g. Fix leaking kitchen sink" error={errors.title} />
      <Textarea label="Describe the job" name="description" maxLength={1500} rows={5} error={errors.description}
        hint="What needs doing, how big it is, and anything the artisan should bring. Don't add phone numbers: you'll get the artisan's contact when you hire." />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="state" className="block text-sm font-medium">State</label>
          <select id="state" name="state" defaultValue={initial.state} aria-invalid={!!errors.state} aria-describedby="state-err" className={sel(errors.state)}>
            <option value="" disabled>Choose</option>
            {states.map((s) => <option key={s} value={s}>{s === "FCT (Abuja)" ? "Abuja (FCT)" : s}</option>)}
          </select>
          <Err id="state-err" msg={errors.state} />
        </div>
        <Input label="Area / LGA" name="lga" maxLength={60} placeholder="e.g. Ikeja" error={errors.lga} />
      </div>
      <p className="-mt-3 text-xs text-muted">Only your area is shown to artisans. Share the exact address with the person you hire.</p>

      <fieldset>
        <legend className="text-sm font-medium">Budget <span className="font-normal text-muted">(optional)</span></legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <Input label="From (₦)" name="budgetMinNaira" inputMode="numeric" placeholder="5,000" error={errors.budgetMinNaira} />
          <Input label="To (₦)" name="budgetMaxNaira" inputMode="numeric" placeholder="20,000" error={errors.budgetMaxNaira} />
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
        {timing === "ON_DATE" && <div className="mt-3"><Input label="Date" name="preferredDate" type="date" min={today} error={errors.preferredDate} /></div>}
      </fieldset>

      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button type="submit" loading={busy} className="w-full">Post job and get quotes</Button>
      <p className="text-center text-xs text-muted">Artisans who offer this service in your state will be notified. Your job stays open for 14 days.</p>
    </form>
  );
}
