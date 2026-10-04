"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { NIGERIA_STATES, profileSchema } from "@/lib/validation/artisan";

type Initial = { businessName: string; bio: string; yearsExperience: number; categoryIds: string[]; state: string; lga: string;
  serviceRadiusKm: number; priceMinNaira?: number; priceMaxNaira?: number; availability: string };
const num = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? undefined : Number(String(v).replace(/,/g, "")));

export function ProfileForm({ categories, initial, isNew }: { categories: { id: string; name: string }[]; initial: Initial; isNew: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [cats, setCats] = useState<string[]>(initial.categoryIds);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function useMyLocation() {
    setGeoMsg("");
    if (!navigator.geolocation) return setGeoMsg("This device can't share its location. Your state and area will be used.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoMsg("Location saved to this form. It is only used to work out distance to customers."); },
      () => setGeoMsg("Location was not shared. Your state and area will be used instead."), { timeout: 10000 });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input = { businessName: f.get("businessName"), bio: String(f.get("bio") ?? "").trim() || undefined,
      yearsExperience: num(f.get("yearsExperience")) ?? 0, categoryIds: cats, state: f.get("state"), lga: f.get("lga"),
      serviceRadiusKm: num(f.get("serviceRadiusKm")) ?? 10, priceMinNaira: num(f.get("priceMinNaira")), priceMaxNaira: num(f.get("priceMaxNaira")),
      availability: f.get("availability"), ...(coords ?? {}) };
    const p = profileSchema.safeParse(input);
    if (!p.success) {
      const fe = p.error.flatten().fieldErrors as Record<string, string[]>;
      return setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])));
    }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch("/api/artisan/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : { form: data.error ?? "Couldn't save your profile. Try again." });
      toast("success", "Profile saved");
      router.push(isNew ? "/artisan/verification" : "/artisan/dashboard"); router.refresh();
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <Input label="Name or business name" name="businessName" defaultValue={initial.businessName} error={errors.businessName} />
      <fieldset>
        <legend className="text-sm font-medium">What services do you offer?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => { const on = cats.includes(c.id); return (
            <label key={c.id} className={`min-h-11 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand-700 ${on ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])} />{c.name}</label>); })}
        </div>
        {errors.categoryIds && <p role="alert" className="mt-1 text-sm text-danger">{errors.categoryIds}</p>}
      </fieldset>
      <Textarea label="About your work" name="bio" defaultValue={initial.bio} hint="Say what you do best and what customers can expect." error={errors.bio} />
      <Input label="Years of experience" name="yearsExperience" type="number" inputMode="numeric" min={0} defaultValue={initial.yearsExperience} error={errors.yearsExperience} />

      <div>
        <label htmlFor="state" className="block text-sm font-medium">State</label>
        <select id="state" name="state" defaultValue={initial.state} aria-invalid={!!errors.state} className="mt-1 w-full rounded-ctl border border-line bg-white p-3">
          <option value="" disabled>Choose your state</option>{NIGERIA_STATES.map((s) => <option key={s}>{s}</option>)}</select>
        {errors.state && <p role="alert" className="mt-1 text-sm text-danger">{errors.state}</p>}
      </div>
      <Input label="Area / LGA" name="lga" defaultValue={initial.lga} placeholder="e.g. Gwarinpa" error={errors.lga} />
      <Input label="How far will you travel? (km)" name="serviceRadiusKm" type="number" inputMode="numeric" min={1} max={100} defaultValue={initial.serviceRadiusKm} error={errors.serviceRadiusKm} />
      <div>
        <Button type="button" variant="outline" onClick={useMyLocation}><span className="inline-flex items-center gap-2"><Icon name="pin" size={18} />Use my current location</span></Button>
        <p role="status" className="mt-2 text-sm text-muted">{geoMsg || "Optional. Your browser will ask permission. Customers never see your exact location."}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Starting price (₦)" name="priceMinNaira" inputMode="numeric" defaultValue={initial.priceMinNaira} error={errors.priceMinNaira} />
        <Input label="Highest price (₦)" name="priceMaxNaira" inputMode="numeric" defaultValue={initial.priceMaxNaira} error={errors.priceMaxNaira} />
      </div>
      <div>
        <label htmlFor="availability" className="block text-sm font-medium">Availability</label>
        <select id="availability" name="availability" defaultValue={initial.availability} className="mt-1 w-full rounded-ctl border border-line bg-white p-3">
          <option value="AVAILABLE_NOW">Available now</option><option value="BY_SCHEDULE">By appointment</option><option value="UNAVAILABLE">Not taking jobs</option></select>
      </div>
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button loading={busy} className="w-full">Save profile</Button>
    </form>
  );
}
