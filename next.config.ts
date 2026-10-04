import type { NextConfig } from "next";

/**
 * Security headers on every response.
 * - Nobody can load FindWorkers inside a frame on another site (clickjacking).
 * - Browsers always use https for this domain after the first visit.
 * - Browsers must not guess file types; referrer details stay on our own site.
 * - Location is allowed only for our own pages (the map's "Use my location"); camera, mic and
 *   payment APIs are off.
 * A full script Content-Security-Policy is left out on purpose: Next.js needs inline scripts, and a
 * strict policy without per-request nonces would break the app. These directives are safe to add.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework/version
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
