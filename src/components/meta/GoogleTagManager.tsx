"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, GTM_ID, readConsent } from "@/lib/meta/pixel";

/**
 * Loads Google Tag Manager only after the visitor accepts cookies (same rule as the Meta Pixel).
 * Renders nothing when the container id is turned off (NEXT_PUBLIC_GTM_ID="off").
 *
 * Do NOT add a Meta Pixel tag inside GTM: the Pixel is already installed in code (MetaPixel.tsx), and a
 * second copy would count every visit and action twice.
 *
 * GTM's own <noscript> iframe is left out on purpose: without JavaScript there is no cookie banner, so
 * visitors could never agree to it.
 */
export function GoogleTagManager() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(readConsent() === "granted");
    const on = (e: Event) => setGranted((e as CustomEvent).detail === "granted");
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  if (!GTM_ID || !granted) return null;
  return (
    <Script id="google-tag-manager" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});
`}</Script>
  );
}
