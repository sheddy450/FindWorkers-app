"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { requestSchema } from "@/lib/validation/request";

type Photo = { key: string; previewUrl: string; status: "uploading" | "done" | "error" };

export function RequestForm({ artisanId, categories }: { artisanId: string; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = 5 - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (file.size > 5 * 1024 * 1024) { setErrors((e) => ({ ...e, photos: "Each photo must be under 5 MB." })); continue; }
      const previewUrl = URL.createObjectURL(file);
      const slot: Photo = { key: "", previewUrl, status: "uploading" };
      setPhotos((p) => [...p, slot]);
      const body = new FormData(); body.set("file", file);
      try {
        const res = await fetch("/api/requests/photos", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setPhotos((p) => p.map((x) => (x === slot ? { ...x, key: data.key, status: "done" } : x)));
      } catch { setPhotos((p) => p.map((x) => (x === slot ? { ...x, status: "error" } : x))); }
    }
  }
  function removePhoto(previewUrl: string) { setPhotos((p) => p.filter((x) => x.previewUrl !== previewUrl)); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photos.some((p) => p.status === "uploading")) return setErrors((er) => ({ ...er, photos: "Wait for photos to finish uploading." }));
    const f = new FormData(e.currentTarget);
    const preferred = String(f.get("preferredAt") ?? "");
    const input = { categoryId: f.get("categoryId"), description: f.get("description"), address: f.get("address"),
      preferredAt: preferred ? new Date(preferred).toISOString() : "", photoKeys: photos.filter((p) => p.status === "done").map((p) => p.key) };
    const p = requestSchema.safeParse(input);
    if (!p.success) {
      const fe = p.error.flatten().fieldErrors as Record<string, string[]>;
      return setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])));
    }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch(`/api/requests?artisanId=${artisanId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : { form: data.error ?? "Couldn't send your request." });
      router.push(`/requests/${data.id}?new=1`);
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium">What's this about?</label>
        <select id="categoryId" name="categoryId" defaultValue="" className="mt-1 w-full rounded-ctl border border-line bg-white p-3">
          <option value="" disabled>Choose a service</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        {errors.categoryId && <p role="alert" className="mt-1 text-sm text-danger">{errors.categoryId}</p>}
      </div>
      <Textarea label="Describe the job" name="description" hint="What needs to be done? Any details that will help the artisan prepare." error={errors.description} />

      <div>
        <label className="block text-sm font-medium">Photos (optional, up to 5)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.previewUrl} className="relative h-20 w-20 overflow-hidden rounded-ctl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
              {p.status === "uploading" && <div className="absolute inset-0 grid place-items-center bg-white/70 text-xs">Uploading…</div>}
              {p.status === "error" && <div className="absolute inset-0 grid place-items-center bg-danger-soft text-xs text-danger">Failed</div>}
              <button type="button" onClick={() => removePhoto(p.previewUrl)} aria-label="Remove photo" className="absolute right-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white">✕</button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-ctl border border-dashed border-line text-xs text-muted">
              + Add<input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} /></label>
          )}
        </div>
        {errors.photos && <p role="alert" className="mt-1 text-sm text-danger">{errors.photos}</p>}
      </div>

      <Input label="Where is the job?" name="address" placeholder="Street, area, landmark" error={errors.address} />
      <Input label="Preferred date/time (optional)" name="preferredAt" type="datetime-local" error={errors.preferredAt} />
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button loading={busy} className="w-full">Send request</Button>
    </form>
  );
}
