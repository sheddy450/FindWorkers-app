"use client";
import { useEffect } from "react";
import { track } from "@/lib/meta/pixel";

/** Sends Meta "ViewContent" once when an artisan profile opens. Renders nothing. */
export function TrackViewContent({ id, service, city }: { id: string; service?: string; city?: string }) {
  useEffect(() => {
    track("ViewContent", { content_type: "artisan_profile", content_ids: [id], content_category: service, city });
  }, [id, service, city]);
  return null;
}
