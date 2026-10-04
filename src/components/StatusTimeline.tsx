import type { RequestStatus } from "@prisma/client";
import { Icon } from "./ui/Icon";
import { LABEL, STEPS } from "@/lib/requests/rules";

export function StatusTimeline({ status }: { status: RequestStatus }) {
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED")
    return <p className="rounded-ctl bg-danger-soft p-3 text-sm font-semibold text-danger">{LABEL[status]}</p>;
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex items-center">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= idx ? "bg-brand text-white" : "bg-line text-muted"}`}>
              {i < idx ? <Icon name="check" size={16} /> : i + 1}</span>
            <span className="w-16 text-center text-[11px] text-muted">{LABEL[s]}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < idx ? "bg-brand" : "bg-line"}`} />}
        </li>
      ))}
    </ol>
  );
}
