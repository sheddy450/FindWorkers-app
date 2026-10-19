/**
 * The guide text format, kept deliberately small so non-developers can write it in a plain text box:
 *   ## A heading          → section heading (also listed in "On this page")
 *   - an item            → bullet list (consecutive lines)
 *   blank line           → new paragraph
 *   **words**            → bold
 * Parsed into blocks (no HTML is ever injected), then rendered by <GuideBody>.
 */
export type Inline = { text: string; bold: boolean };
export type Block =
  | { type: "h2"; id: string; text: string }
  | { type: "p"; parts: Inline[] }
  | { type: "ul"; items: Inline[][] };

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  return out.length ? out : [{ text: "", bold: false }];
}

export function parseBody(src: string): Block[] {
  const blocks: Block[] = [];
  const used = new Set<string>();
  let para: string[] = [], list: string[] = [];
  const flushPara = () => { if (para.length) blocks.push({ type: "p", parts: inline(para.join(" ")) }); para = []; };
  const flushList = () => { if (list.length) blocks.push({ type: "ul", items: list.map(inline) }); list = []; };
  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const h = /^#{2,3}\s+(.+)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      let id = slugify(h[1]) || "section", n = 2;
      while (used.has(id)) id = `${slugify(h[1])}-${n++}`;
      used.add(id);
      blocks.push({ type: "h2", id, text: h[1].trim() });
      continue;
    }
    const li = /^[-*•]\s+(.+)$/.exec(line);
    if (li) { flushPara(); list.push(li[1]); continue; }
    flushList(); para.push(line);
  }
  flushPara(); flushList();
  return blocks;
}

/** Reading time at ~200 words a minute (Nigerian English readers on phones), at least 1 minute. */
export function readMinutes(...texts: (string | string[] | null | undefined)[]): number {
  const words = texts.flat().filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
