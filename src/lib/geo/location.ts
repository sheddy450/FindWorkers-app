"use client";
import { useEffect, useState } from "react";
export type Loc = { lat: number; lng: number } | null;
const KEY = "fw:lastLocation";

/** In-memory + sessionStorage only; never sent anywhere until the person searches. */
export function useLocation() {
  const [loc, setLoc] = useState<Loc>(null);
  const [status, setStatus] = useState<"idle" | "denied" | "unavailable" | "ok">("idle");
  useEffect(() => {
    try { const s = sessionStorage.getItem(KEY); if (s) { setLoc(JSON.parse(s)); setStatus("ok"); } } catch {}
  }, []);
  function request() {
    if (!navigator.geolocation) return setStatus("unavailable");
    navigator.geolocation.getCurrentPosition(
      (p) => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setLoc(l); setStatus("ok"); try { sessionStorage.setItem(KEY, JSON.stringify(l)); } catch {} },
      () => setStatus("denied"), { timeout: 10000 });
  }
  return { loc, status, request };
}
