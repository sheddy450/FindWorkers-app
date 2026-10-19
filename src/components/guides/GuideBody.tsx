import type { Block, Inline } from "@/lib/guides/format";

const Text = ({ parts }: { parts: Inline[] }) => <>{parts.map((p, i) => (p.bold ? <strong key={i} className="font-semibold text-ink">{p.text}</strong> : <span key={i}>{p.text}</span>))}</>;

/** Renders parsed guide text. Only these elements are ever produced: no HTML from the database. */
export function GuideBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-[17px] leading-[1.7] text-ink/85">
      {blocks.map((b, i) =>
        b.type === "h2" ? <h2 key={i} id={b.id} className="scroll-mt-24 pt-4 text-2xl font-bold tracking-tight text-ink">{b.text}</h2>
        : b.type === "ul" ? (
          <ul key={i} className="space-y-2 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-3"><span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /><span><Text parts={it} /></span></li>
            ))}
          </ul>
        ) : <p key={i}><Text parts={b.parts} /></p>,
      )}
    </div>
  );
}
