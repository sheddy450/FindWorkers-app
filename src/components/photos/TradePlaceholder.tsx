/**
 * Neutral illustration for a trade, shown wherever a photo is missing (or fails to load).
 * Simple original line drawings in the brand greens, picked by keywords in the service name.
 */
type Glyph = { keys: RegExp; draw: React.ReactNode };

const S = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const GLYPHS: Glyph[] = [
  { keys: /plumb|pipe|water|borehole/i, draw: <g {...S}><path d="M10 22h18a6 6 0 0 1 6 6v8" /><path d="M10 16v12" /><path d="M28 40h12" /><path d="M34 40v4" /><path d="M34 50c-2 3-2 5 0 6 2-1 2-3 0-6z" /><path d="M46 14l8 8-6 6-8-8z" /><path d="M42 24l-6 6" /></g> },
  { keys: /electric|wiring|cable|light/i, draw: <g {...S}><path d="M36 8L20 34h12l-4 22 16-28H32z" /></g> },
  { keys: /solar|inverter|panel/i, draw: <g {...S}><circle cx="46" cy="16" r="6" /><path d="M46 4v3M46 25v3M34 16h3M55 16h3" /><path d="M8 54l8-22h26l-8 22z" /><path d="M12 43h26M24 32l-6 22M33 32l-6 22" /></g> },
  { keys: /generator|gen\b|mechanic|auto|vehicle|car|motor/i, draw: <g {...S}><circle cx="32" cy="32" r="10" /><path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M18 46l4-4M42 22l4-4" /></g> },
  { keys: /tailor|fashion|sew|cloth|seam/i, draw: <g {...S}><circle cx="18" cy="46" r="6" /><circle cx="18" cy="22" r="6" /><path d="M23 25l27 17M23 43l27-17" /><path d="M50 10l-4 22" /><circle cx="51" cy="8" r="2" /></g> },
  { keys: /carpent|wood|furniture|joiner/i, draw: <g {...S}><path d="M8 40l28-28 8 8-28 28H8z" /><path d="M14 34l8 8M20 28l8 8M26 22l8 8" /><path d="M44 44l12 12" /></g> },
  { keys: /paint|decor|pop|ceiling|screed/i, draw: <g {...S}><rect x="10" y="10" width="34" height="14" rx="3" /><path d="M44 17h6v12H28v8" /><rect x="24" y="37" width="8" height="18" rx="2" /></g> },
  { keys: /ac\b|air ?con|hvac|fridge|refrigerat|cool/i, draw: <g {...S}><path d="M32 8v48M11 20l42 24M11 44l42-24" /><path d="M26 12l6 5 6-5M26 52l6-5 6 5" /></g> },
  { keys: /clean|laundry|fumigat|pest/i, draw: <g {...S}><path d="M18 26h22l-3 30H21z" /><path d="M24 26v-8h10v8" /><path d="M46 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" /></g> },
  { keys: /hair|barb|salon|beaut|make ?up|nail/i, draw: <g {...S}><path d="M14 10v44" /><path d="M14 14h12M14 20h12M14 26h12M14 32h12M14 38h12" /><circle cx="44" cy="44" r="6" /><path d="M44 38V12l8 6" /></g> },
  { keys: /til|floor|mason|brick|build|construct/i, draw: <g {...S}><rect x="8" y="12" width="20" height="12" /><rect x="36" y="12" width="20" height="12" /><rect x="20" y="30" width="24" height="12" /><rect x="8" y="48" width="20" height="8" /><rect x="36" y="48" width="20" height="8" /></g> },
  { keys: /weld|metal|iron|gate/i, draw: <g {...S}><path d="M10 54l22-22" /><path d="M32 32l8-8 6 6-8 8z" /><path d="M46 14l2-6M52 20l6-2M50 16l6-6" /></g> },
  { keys: /phone|computer|laptop|gadget|tv|electronic/i, draw: <g {...S}><rect x="20" y="8" width="24" height="44" rx="5" /><path d="M29 46h6" /></g> },
];

const TOOLBOX = <g {...S}><rect x="8" y="24" width="48" height="28" rx="4" /><path d="M24 24v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6" /><path d="M8 36h48" /><path d="M28 36v6h8v-6" /></g>;

export function glyphFor(trade?: string | null): React.ReactNode {
  if (!trade) return TOOLBOX;
  return GLYPHS.find((g) => g.keys.test(trade))?.draw ?? TOOLBOX;
}

export function TradePlaceholder({ trade, className = "", size = "md" }: { trade?: string | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 72 : 48;
  return (
    <div role="img" aria-label={trade ? `${trade} (no photo yet)` : "No photo yet"}
            // soft dotted texture so the empty space reads as intentional, not broken
      style={{ backgroundImage: "radial-gradient(rgba(0,122,73,0.10) 1.4px, transparent 1.5px)", backgroundSize: "14px 14px" }}
      className={`relative grid place-items-center overflow-hidden bg-brand-soft text-brand ${className}`}>
      <svg aria-hidden viewBox="0 0 64 64" width={px} height={px} className="relative opacity-80">{glyphFor(trade)}</svg>
    </div>
  );
}
