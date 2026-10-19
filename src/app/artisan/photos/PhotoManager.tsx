"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { preparePhoto, type PreparedPhoto } from "@/lib/photos/compress";
import { captionError, CATEGORY_LABEL } from "@/lib/photos/rules";

type Cat = "PROFILE" | "PORTFOLIO" | "BEFORE" | "AFTER" | "WORKSHOP";
export type ManagedPhoto = {
  id: string; thumbUrl: string; blurDataUrl: string | null; caption: string; category: Cat;
  categoryId: string | null; pairKey: string | null; isCover: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED"; rejectReason: string | null;
};
type Service = { id: string; name: string };

async function api(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Something went wrong. Try again.");
  return body;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function StatusBadge({ p }: { p: ManagedPhoto }) {
  if (p.status === "APPROVED") return <Badge tone="verified">Live</Badge>;
  if (p.status === "REJECTED") return <Badge tone="danger">Not approved</Badge>;
  return <Badge tone="warning">Awaiting review</Badge>;
}

function Thumb({ p, className = "" }: { p: Pick<ManagedPhoto, "thumbUrl" | "blurDataUrl" | "caption">; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.thumbUrl} alt={p.caption} loading="lazy" decoding="async"
      style={p.blurDataUrl ? { backgroundImage: `url(${p.blurDataUrl})`, backgroundSize: "cover" } : undefined}
      className={`bg-brand-soft object-cover ${className}`} />
  );
}

/** Picks a file (drag-and-drop, file chooser, or the phone camera) and compresses it on the device. */
function Picker({ label, disabled, onReady }: { label: string; disabled?: boolean; onReady: (p: PreparedPhoto) => void }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null), camRef = useRef<HTMLInputElement>(null);
  async function take(file?: File | null) {
    if (!file) return;
    setErr(""); setBusy(true);
    try { onReady(await preparePhoto(file)); }
    catch (e) { setErr(e instanceof Error ? e.message : "We couldn't open this photo."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; if (camRef.current) camRef.current.value = ""; }
  }
  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files?.[0]); }}
        className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-5 text-center transition-colors ${over ? "border-brand bg-brand-soft" : "border-line bg-paper"} ${disabled ? "opacity-60" : ""}`}>
        <p className="text-sm text-muted">{busy ? "Preparing your photo…" : <>Drag a photo here, or</>}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => fileRef.current?.click()}>{label}</Button>
          <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => camRef.current?.click()} className="sm:hidden">Take photo</Button>
        </div>
        <p className="text-xs text-muted">JPG, PNG, WebP or HEIC. We shrink it on your phone so it uploads fast on any network.</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => take(e.target.files?.[0])} />
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}

const sel = "w-full rounded-ctl border border-line bg-white p-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

/** Caption + type + service form shown after a photo has been chosen. */
function UploadForm({ prepared, kind, services, photos, onCancel, onDone }: {
  prepared: PreparedPhoto; kind: "PROFILE" | "WORK"; services: Service[]; photos: ManagedPhoto[]; onCancel: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<Cat>(kind === "PROFILE" ? "PROFILE" : "PORTFOLIO");
  const [categoryId, setCategoryId] = useState(services.length === 1 ? services[0].id : "");
  const [pairWith, setPairWith] = useState("");
  const [busy, setBusy] = useState(false), [touched, setTouched] = useState(false), [err, setErr] = useState("");
  const capErr = captionError(caption);
  const wantedPartner = category === "BEFORE" ? "AFTER" : category === "AFTER" ? "BEFORE" : null;
  const partners = wantedPartner ? photos.filter((p) => p.category === wantedPartner && !p.pairKey) : [];

  useEffect(() => () => URL.revokeObjectURL(prepared.previewUrl), [prepared]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setTouched(true); setErr("");
    if (capErr) return;
    const f = new FormData();
    f.set("image", prepared.image, prepared.image.type === "image/webp" ? "photo.webp" : "photo.jpg");
    f.set("thumb", prepared.thumb, prepared.thumb.type === "image/webp" ? "thumb.webp" : "thumb.jpg");
    f.set("blur", prepared.blur); if (prepared.hash) f.set("hash", prepared.hash); f.set("caption", caption.trim()); f.set("category", category);
    if (categoryId) f.set("categoryId", categoryId);
    if (pairWith) f.set("pairWith", pairWith);
    setBusy(true);
    try {
      await api("/api/artisan/photos", { method: "POST", body: f });
      toast("success", "Photo uploaded. We'll review it shortly, usually within a day.");
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={prepared.previewUrl} alt="" className={`h-28 w-28 shrink-0 object-cover ${kind === "PROFILE" ? "rounded-full" : "rounded-ctl"}`} />
        <div className="min-w-0 flex-1">
          <label htmlFor="ph-caption" className="block text-sm font-medium">{kind === "PROFILE" ? "Describe this photo" : "What does this photo show?"}</label>
          <textarea id="ph-caption" rows={3} maxLength={140} value={caption} onChange={(e) => setCaption(e.target.value)} onBlur={() => setTouched(true)}
            placeholder={kind === "PROFILE" ? "e.g. Emeka in his workshop in Enugu" : "e.g. POP ceiling with LED lights, 3-bedroom flat in Lekki"}
            aria-invalid={touched && !!capErr} aria-describedby="ph-caption-msg"
            className={`mt-1 w-full rounded-ctl border bg-white p-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 ${touched && capErr ? "border-danger" : "border-line"}`} />
          <p id="ph-caption-msg" className={`text-xs ${touched && capErr ? "text-danger" : "text-muted"}`}>
            {touched && capErr ? capErr : `Customers (and screen readers) read this. ${caption.trim().length}/140`}
          </p>
        </div>
      </div>

      {kind === "WORK" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ph-cat" className="block text-sm font-medium">Type of photo</label>
            <select id="ph-cat" className={`${sel} mt-1`} value={category} onChange={(e) => { setCategory(e.target.value as Cat); setPairWith(""); }}>
              {(["PORTFOLIO", "BEFORE", "AFTER", "WORKSHOP"] as const).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ph-svc" className="block text-sm font-medium">Service</label>
            <select id="ph-svc" className={`${sel} mt-1`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Not specific</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {wantedPartner && (
            <div className="sm:col-span-2">
              <label htmlFor="ph-pair" className="block text-sm font-medium">Pair with your “{CATEGORY_LABEL[wantedPartner]}” photo (optional)</label>
              <select id="ph-pair" className={`${sel} mt-1`} value={pairWith} onChange={(e) => setPairWith(e.target.value)} disabled={!partners.length}>
                <option value="">{partners.length ? "No pair" : `No unpaired “${CATEGORY_LABEL[wantedPartner]}” photos yet`}</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.caption}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted">Paired photos show as a before/after slider on your profile.</p>
            </div>
          )}
        </div>
      )}

      {err && <Alert variant="error" title={err} />}
      <div className="flex gap-2">
        <Button type="submit" loading={busy} className="flex-1">{busy ? "Uploading…" : "Upload photo"}</Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
      <p className="text-xs text-muted">Only upload photos of your own work. Stock or copied photos are removed.</p>
    </form>
  );
}

/** One work photo in the manage grid. */
function WorkItem({ p, i, count, services, busy, onPatch, onDelete, onMove, drag }: {
  p: ManagedPhoto; i: number; count: number; services: Service[]; busy: boolean;
  onPatch: (b: Record<string, unknown>) => Promise<boolean>; onDelete: () => void; onMove: (to: number) => void;
  drag: { onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDrop: () => void; dragging: boolean };
}) {
  const [editing, setEditing] = useState(false), [caption, setCaption] = useState(p.caption), [confirm, setConfirm] = useState(false);
  const capErr = captionError(caption);
  return (
    <li draggable={!editing} onDragStart={drag.onDragStart} onDragOver={drag.onDragOver} onDrop={drag.onDrop}
      className={`overflow-hidden rounded-card border bg-white shadow-soft ${drag.dragging ? "opacity-50" : ""} ${p.isCover ? "border-brand ring-2 ring-brand/30" : "border-line"}`}>
      <div className="relative aspect-[4/3]">
        <Thumb p={p} className="h-full w-full" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.isCover && <Badge tone="brand">Cover</Badge>}
          {p.category !== "PORTFOLIO" && <Badge>{CATEGORY_LABEL[p.category]}{p.pairKey ? " · paired" : ""}</Badge>}
        </div>
        <div className="absolute right-2 top-2"><StatusBadge p={p} /></div>
      </div>
      <div className="space-y-2 p-3 text-sm">
        {p.status === "REJECTED" && p.rejectReason && <p className="text-danger">Reason: {p.rejectReason}</p>}
        {editing ? (
          <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!capErr && await onPatch({ caption: caption.trim() })) setEditing(false); }}>
            <label htmlFor={`cap-${p.id}`} className="sr-only">Caption</label>
            <textarea id={`cap-${p.id}`} rows={2} maxLength={140} value={caption} onChange={(e) => setCaption(e.target.value)} className={`${sel} p-2 text-sm`} />
            {capErr && <p className="text-xs text-danger">{capErr}</p>}
            <p className="text-xs text-muted">Changing the caption sends the photo for review again.</p>
            <div className="flex gap-2">
              <Button type="submit" className="min-h-9 px-3 text-sm" disabled={busy || !!capErr}>Save</Button>
              <Button type="button" variant="outline" className="min-h-9 px-3 text-sm" onClick={() => { setCaption(p.caption); setEditing(false); }}>Cancel</Button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="block w-full text-left hover:text-brand" aria-label={`Edit caption: ${p.caption}`}>
            {p.caption} <span className="text-muted">✎</span>
          </button>
        )}
        {services.length > 0 && (
          <>
            <label htmlFor={`svc-${p.id}`} className="sr-only">Service</label>
            <select id={`svc-${p.id}`} value={p.categoryId ?? ""} disabled={busy} className={`${sel} p-2 text-sm`}
              onChange={(e) => onPatch({ categoryId: e.target.value || null })}>
              <option value="">Service: not specific</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" disabled={busy || i === 0} onClick={() => onMove(i - 1)} aria-label="Move earlier"
            className="grid h-9 w-9 place-items-center rounded-ctl border border-line disabled:opacity-40">↑</button>
          <button type="button" disabled={busy || i === count - 1} onClick={() => onMove(i + 1)} aria-label="Move later"
            className="grid h-9 w-9 place-items-center rounded-ctl border border-line disabled:opacity-40">↓</button>
          {!p.isCover && p.status !== "REJECTED" && (
            <button type="button" disabled={busy} onClick={() => onPatch({ isCover: true })}
              className="h-9 rounded-ctl border border-line px-3 font-medium hover:bg-paper">Make cover</button>
          )}
          <span className="flex-1" />
          {confirm ? (
            <>
              <button type="button" disabled={busy} onClick={onDelete} className="h-9 rounded-ctl bg-danger px-3 font-semibold text-white">Delete</button>
              <button type="button" onClick={() => setConfirm(false)} className="h-9 rounded-ctl border border-line px-3">Keep</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} aria-label="Delete photo"
              className="grid h-9 w-9 place-items-center rounded-ctl border border-line text-danger hover:bg-danger-soft"><Icon name="x" size={16} /></button>
          )}
        </div>
      </div>
    </li>
  );
}

export function PhotoManager({ photos, services, maxWork, enabled }: { photos: ManagedPhoto[]; services: Service[]; maxWork: number; enabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const profile = photos.find((p) => p.category === "PROFILE") ?? null;
  const [work, setWork] = useState(() => photos.filter((p) => p.category !== "PROFILE"));
  useEffect(() => setWork(photos.filter((p) => p.category !== "PROFILE")), [photos]);
  const [pending, setPending] = useState<{ kind: "PROFILE" | "WORK"; prepared: PreparedPhoto } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const full = work.length >= maxWork;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try { await api(`/api/artisan/photos/${id}`, json("PATCH", body)); router.refresh(); return true; }
    catch (e) { toast("error", e instanceof Error ? e.message : "Couldn't save. Try again."); return false; }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true);
    try { await api(`/api/artisan/photos/${id}`, { method: "DELETE" }); toast("success", "Photo deleted."); router.refresh(); }
    catch (e) { toast("error", e instanceof Error ? e.message : "Couldn't delete. Try again."); }
    finally { setBusy(false); }
  }
  async function move(from: number, to: number) {
    if (from === to || to < 0 || to >= work.length) return;
    const before = work;
    const next = [...work]; const [it] = next.splice(from, 1); next.splice(to, 0, it);
    setWork(next); setBusy(true);
    try { await api("/api/artisan/photos/reorder", json("POST", { ids: next.map((p) => p.id) })); router.refresh(); }
    catch (e) { setWork(before); toast("error", e instanceof Error ? e.message : "Couldn't reorder. Try again."); }
    finally { setBusy(false); }
  }
  const done = () => { setPending(null); router.refresh(); };

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Profile photo</h2>
          <p className="text-sm text-muted">A clear, friendly photo of your face. Customers trust people they can see.</p>
        </div>
        {pending?.kind === "PROFILE" ? (
          <UploadForm prepared={pending.prepared} kind="PROFILE" services={services} photos={photos} onCancel={() => setPending(null)} onDone={done} />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile ? (
              <div className="flex items-center gap-3">
                <Thumb p={profile} className="h-20 w-20 rounded-full" />
                <div className="space-y-1"><StatusBadge p={profile} />
                  {profile.status === "REJECTED" && profile.rejectReason && <p className="text-sm text-danger">{profile.rejectReason}</p>}</div>
              </div>
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="user" size={32} /></div>
            )}
            <div className="flex-1">
              <Picker label={profile ? "Change photo" : "Choose photo"} disabled={!enabled || !!pending} onReady={(prepared) => setPending({ kind: "PROFILE", prepared })} />
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Photos of your work</h2>
            <p className="text-sm text-muted">Finished jobs, before &amp; after, and your workshop. The cover photo shows on your card in search.</p>
          </div>
          <p className="shrink-0 text-sm font-medium text-muted" aria-live="polite">{work.length}/{maxWork}</p>
        </div>

        {pending?.kind === "WORK" ? (
          <UploadForm prepared={pending.prepared} kind="WORK" services={services} photos={photos} onCancel={() => setPending(null)} onDone={done} />
        ) : full ? (
          <Alert variant="info" title={`You have ${maxWork} work photos, the most allowed.`}>Delete one to add another. Keep your best and most recent.</Alert>
        ) : (
          <Picker label="Add a work photo" disabled={!enabled || !!pending} onReady={(prepared) => setPending({ kind: "WORK", prepared })} />
        )}

        {work.length === 0 ? (
          <div className="rounded-card bg-paper p-5 text-center text-sm text-muted">
            <p className="font-medium text-ink">No work photos yet</p>
            <p className="mt-1">Tips: shoot in daylight, step back so the whole job is in frame, and wipe your lens. Add 3 or more to fill your profile.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted">Use ↑ ↓ to change the order, or drag photos on a computer. New photos appear to customers after a quick review.</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {work.map((p, i) => (
                <WorkItem key={p.id} p={p} i={i} count={work.length} services={services} busy={busy}
                  onPatch={(b) => patch(p.id, b)} onDelete={() => remove(p.id)} onMove={(to) => move(i, to)}
                  drag={{
                    dragging: dragFrom === i,
                    onDragStart: () => setDragFrom(i),
                    onDragOver: (e) => e.preventDefault(),
                    onDrop: () => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); },
                  }} />
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
