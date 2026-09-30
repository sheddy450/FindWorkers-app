import { Icon, IconName } from "./Icon";
const v = {
  info: ["bg-indigo-soft text-indigo", "info"], success: ["bg-verified-soft text-verified", "check"],
  warning: ["bg-marigold-soft text-ink", "alert"], error: ["bg-danger-soft text-danger", "alert"],
} as const;
export function Alert({ variant = "info", title, children }: { variant?: keyof typeof v; title?: string; children?: React.ReactNode }) {
  const [cls, icon] = v[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`flex gap-3 rounded-ctl p-3 text-sm ${cls}`}>
      <span className="mt-0.5 shrink-0"><Icon name={icon as IconName} size={18} /></span>
      <div>{title && <p className="font-semibold">{title}</p>}{children && <p>{children}</p>}</div>
    </div>
  );
}
