"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useLocation } from "@/lib/geo/location";
import { NIGERIA_STATES } from "@/lib/validation/artisan";

export function LocationScreen() {
  const router = useRouter();
  const { status, request } = useLocation();
  const [manual, setManual] = useState(false);

  // useLocation persists granted coords to sessionStorage itself; once status flips to "ok", move on to search.
  useEffect(() => {
    if (status === "ok") router.push("/search");
  }, [status, router]);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="pin" size={32} /></div>
      <h1 className="mt-4 text-2xl font-bold text-brand">Find artisans near you</h1>
      <p className="mt-2 text-muted">We'll only use your location to show distance and nearby artisans. You can change this anytime.</p>

      {!manual ? (
        <div className="mt-6 w-full space-y-3">
          <Button className="w-full" onClick={request}>Enable location</Button>
          <Button variant="outline" className="w-full" onClick={() => setManual(true)}>Enter my area manually</Button>
          <button type="button" onClick={() => router.push("/search")} className="text-sm text-muted underline">Skip for now</button>
          {status === "denied" && <div className="text-left"><Alert variant="warning" title="Location wasn't shared">You can still browse by entering your state and area.</Alert></div>}
          {status === "ok" && <div className="text-left"><Alert variant="success" title="Location enabled">Taking you to search…</Alert></div>}
        </div>
      ) : (
        <ManualLocation />
      )}
    </main>
  );
}

function ManualLocation() {
  const router = useRouter();
  const [error, setError] = useState("");
  function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const state = String(f.get("state") ?? ""); const lga = String(f.get("lga") ?? "").trim();
    if (!state) return setError("Choose your state.");
    if (lga.length < 2) return setError("Enter your area or LGA.");
    const q = new URLSearchParams({ state, lga });
    router.push(`/search?${q}`);
  }
  return (
    <form onSubmit={go} className="mt-6 w-full space-y-3 text-left">
      <div>
        <label htmlFor="state" className="block text-sm font-medium">State</label>
        <select id="state" name="state" defaultValue="" className="mt-1 w-full rounded-ctl border border-line bg-white p-3">
          <option value="" disabled>Choose your state</option>{NIGERIA_STATES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div>
        <label htmlFor="lga" className="block text-sm font-medium">Area / LGA</label>
        <input id="lga" name="lga" placeholder="e.g. Gwarinpa" className="mt-1 w-full rounded-ctl border border-line bg-white p-3" />
      </div>
      {error && <Alert variant="error" title={error} />}
      <Button className="w-full">Continue</Button>
    </form>
  );
}
