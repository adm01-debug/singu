/**
 * Algoritmo BFS para encontrar o caminho mais curto entre dois nós em um grafo.
 * Usado no Graph para realçar relações entre 2 entidades pinadas.
 */
export interface GraphEdge {
  source: string;
  target: string;
}

export function shortestPath(
  edges: GraphEdge[],
  fromId: string,
  toId: string,
): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = new Map<string, Set<string>>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  });
  if (!adj.has(fromId) || !adj.has(toId)) return null;

  const visited = new Set<string>([fromId]);
  const parent = new Map<string, string>();
  const queue: string[] = [fromId];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === toId) {
      const path: string[] = [toId];
      let cur = toId;
      while (parent.has(cur)) {
        cur = parent.get(cur)!;
        path.unshift(cur);
      }
      return path;
    }
    for (const next of adj.get(node) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      parent.set(next, node);
      queue.push(next);
    }
  }
  return null;
}
