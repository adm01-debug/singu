/**
 * Utilitários para medição de performance com Performance API.
 * Usa User Timing API (mark/measure) para métricas customizadas.
 */

const PREFIX = 'singu';

/**
 * Marca o início de uma operação para medição.
 */
export function perfMark(name: string): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.mark(`${PREFIX}:${name}`);
  } catch {
    // noop — silently fail in environments without Performance API
  }
}

/**
 * Mede a duração entre duas marks e retorna em ms.
 */
export function perfMeasure(name: string, startMark: string, endMark?: string): number | null {
  if (typeof performance === 'undefined') return null;
  try {
    if (endMark) {
      performance.mark(`${PREFIX}:${endMark}`);
    }
    const measure = performance.measure(
      `${PREFIX}:${name}`,
      `${PREFIX}:${startMark}`,
      endMark ? `${PREFIX}:${endMark}` : undefined
    );
    return Math.round(measure.duration * 100) / 100;
  } catch {
    return null;
  }
}

/**
 * Mede a duração de uma operação async automaticamente.
 * 
 * @example
 * const data = await perfTrack('fetch-contacts', () => fetchContacts());
 */
export async function perfTrack<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const markStart = `${name}-start`;
  perfMark(markStart);
  try {
    const result = await fn();
    const duration = perfMeasure(name, markStart, `${name}-end`);
    if (import.meta.env.DEV && duration !== null) {
      logger.info(`⏱ [${name}]: ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = perfMeasure(`${name}-error`, markStart, `${name}-error-end`);
    if (import.meta.env.DEV && duration !== null) {
      console.warn(`⏱ [${name}] failed after ${duration}ms`);
    }
    throw error;
  }
}

/**
 * Retorna todas as medições SINGU registradas.
 */
export function perfGetEntries(): PerformanceEntry[] {
  if (typeof performance === 'undefined') return [];
  return performance.getEntriesByType('measure').filter(e => e.name.startsWith(PREFIX));
}

/**
 * Limpa todas as marks e measures SINGU.
 */
export function perfClear(): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.getEntriesByType('mark')
      .filter(e => e.name.startsWith(PREFIX))
      .forEach(e => performance.clearMarks(e.name));
    performance.getEntriesByType('measure')
      .filter(e => e.name.startsWith(PREFIX))
      .forEach(e => performance.clearMeasures(e.name));
  } catch {
    // noop
  }
}
