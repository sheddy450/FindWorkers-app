/**
 * Wraps every page. Re-mounts on navigation, so new content eases in (a short fade and a 6px rise)
 * instead of snapping. Uses only opacity/transform, and is switched off for "reduce motion".
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="fw-enter">{children}</div>;
}
