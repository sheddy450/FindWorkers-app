/** Deep links only. Numbers are never rendered in markup unless the viewer is authenticated (checked server-side by callers). */
export function telHref(e164: string) { return `tel:${e164}`; }
export function whatsappHref(e164: string, message: string) {
  return `https://wa.me/${e164.replace("+", "")}?text=${encodeURIComponent(message)}`;
}
