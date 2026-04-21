export type SortKey = 'recent' | 'oldest' | 'relevance' | 'entity';

interface SortableItem {
  date?: string | Date | null;
  created_at?: string | Date | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  contact_name?: string | null;
  company_name?: string | null;
}

function getTime(item: SortableItem): number {
  const v = item.date ?? item.created_at;
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count += 1;
    idx += n.length;
  }
  return count;
}

function relevanceScore(item: SortableItem, q: string): number {
  const title = item.title ?? '';
  const content = item.content ?? '';
  const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  return (
    countOccurrences(title, q) * 3 +
    countOccurrences(tags, q) * 2 +
    countOccurrences(content, q)
  );
}

function entityKey(item: SortableItem): string {
  return (item.contact_name ?? item.company_name ?? '').trim();
}

export function sortInteractions<T extends SortableItem>(
  items: T[],
  sort: SortKey,
  query?: string,
): T[] {
  if (!Array.isArray(items)) return [];
  const arr = items.slice();
  const q = (query ?? '').trim();
  const effective: SortKey = sort === 'relevance' && !q ? 'recent' : sort;

  switch (effective) {
    case 'oldest':
      return arr.sort((a, b) => getTime(a) - getTime(b));
    case 'entity':
      return arr.sort((a, b) => {
        const cmp = entityKey(a).localeCompare(entityKey(b), 'pt-BR', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : getTime(b) - getTime(a);
      });
    case 'relevance':
      return arr.sort((a, b) => {
        const sb = relevanceScore(b, q) - relevanceScore(a, q);
        return sb !== 0 ? sb : getTime(b) - getTime(a);
      });
    case 'recent':
    default:
      return arr.sort((a, b) => getTime(b) - getTime(a));
  }
}
