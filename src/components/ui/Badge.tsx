const tone = {
  neutral: "bg-paper text-muted border border-line",
  brand: "bg-brand-soft text-brand",
  verified: "bg-verified-soft text-verified",   // reserved for approved verifications
  warning: "bg-highlight-soft text-ink",
  danger: "bg-danger-soft text-danger",
};
export function Badge({ tone: t = "neutral", children }: { tone?: keyof typeof tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${tone[t]}`}>{children}</span>;
}
