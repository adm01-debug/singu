export interface Excerpt {
  interactionId: string;
  text: string;
  matchTerm: string;
  position: number;
}

export interface ExtractOptions {
  totalCap: number;
  maxPerSource: number;
  window: number;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface RawHit {
  interactionId: string;
  text: string;
  matchTerm: string;
  position: number;
}

export function extractExcerpts(
  sources: Array<{ id: string; text: string }>,
  keywords: string[],
  opts: ExtractOptions,
): Excerpt[] {
  if (!Array.isArray(sources) || !Array.isArray(keywords) || keywords.length === 0) return [];
  const cleanKeywords = keywords.map((k) => k?.trim()).filter((k): k is string => !!k && k.length > 1);
  if (cleanKeywords.length === 0) return [];

  const escaped = cleanKeywords.map((k) => escapeRegex(normalize(k)));
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`, "giu");

  const half = Math.max(40, Math.floor(opts.window / 2));
  const hitsBySource = new Map<string, RawHit[]>();

  for (const src of sources) {
    if (!src?.id || typeof src.text !== "string" || src.text.length === 0) continue;
    const original = src.text;
    const norm = normalize(original);
    re.lastIndex = 0;
    const sourceHits: RawHit[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm)) !== null) {
      const matchStart = m.index + (m[0].length - m[1].length);
      const matchEnd = matchStart + m[1].length;
      const start = Math.max(0, matchStart - half);
      const end = Math.min(original.length, matchEnd + half);
      let snippet = original.slice(start, end).trim();
      if (start > 0) snippet = "…" + snippet;
      if (end < original.length) snippet = snippet + "…";
      sourceHits.push({
        interactionId: src.id,
        text: snippet,
        matchTerm: original.slice(matchStart, matchEnd),
        position: matchStart,
      });
      if (sourceHits.length >= opts.maxPerSource) break;
    }
    if (sourceHits.length > 0) hitsBySource.set(src.id, sourceHits);
  }

  const result: Excerpt[] = [];
  const sourceOrder = sources.map((s) => s.id).filter((id) => hitsBySource.has(id));
  const cursors = new Map<string, number>();
  for (const id of sourceOrder) cursors.set(id, 0);

  while (result.length < opts.totalCap) {
    let added = false;
    for (const id of sourceOrder) {
      if (result.length >= opts.totalCap) break;
      const list = hitsBySource.get(id)!;
      const idx = cursors.get(id)!;
      if (idx < list.length) {
        result.push(list[idx]);
        cursors.set(id, idx + 1);
        added = true;
      }
    }
    if (!added) break;
  }

  return result;
}
