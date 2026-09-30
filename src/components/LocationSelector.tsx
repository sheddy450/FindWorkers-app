"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";

const KEY = "fw:lastLocation";

/** Reads the same sessionStorage key useLocation() writes to, just to show a status line here. */
export function LocationSelector() {
  const [hasLocation, setHasLocation] = useState<boolean | null>(null);
  useEffect(() => {
    try { setHasLocation(!!sessionStorage.getItem(KEY)); } catch { setHasLocation(false); }
  }, []);

  return (
    <Link href="/location" className="mt-4 flex items-center gap-2 text-sm text-muted">
      <Icon name="pin" size={16} />
      {hasLocation === null ? "Location" : hasLocation ? "Location set · Change" : "Set your location to see distance"}
    </Link>
  );
}
