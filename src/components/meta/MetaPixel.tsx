"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, PIXEL_ID, readConsent } from "@/lib/meta/pixel";

/**
 * Loads the Meta Pixel only after the visitor accepts cookies, then sends a PageView on the first
 * load and on every in-app page change (the app changes pages without full reloads).
 * Renders nothing when NEXT_PUBLIC_META_PIXEL_ID isn't set.
 */
export function MetaPixel() {
  const [granted, setGranted] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    setGranted(readConsent() === "granted");
    const on = (e: Event) => setGranted((e as CustomEvent).detail === "granted");
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  // In-app page changes. The very first PageView is sent by the base code below; the marker stops a double count.
  useEffect(() => {
    if (!granted || !window.fbq) return;
    const here = `${pathname}?${search?.toString() ?? ""}`;
    if (window.__fwLastPageView === here) return;
    window.__fwLastPageView = here;
    window.fbq("track", "PageView");
  }, [granted, pathname, search]);

  if (!PIXEL_ID || !granted) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('consent','grant');
fbq('init',${JSON.stringify(PIXEL_ID)});
window.__fwLastPageView=location.pathname+'?'+location.search.slice(1);
fbq('track','PageView');
`}</Script>
  );
}
