/**
 * Web Vitals monitoring using the native PerformanceObserver API.
 * Tracks Core Web Vitals (LCP, FID, CLS, INP, TTFB) without external dependencies.
 *
 * Usage:
 *   import { initWebVitals } from '@/lib/web-vitals';
 *   initWebVitals({ onMetric: (metric) => console.log(metric) });
 */

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

type MetricCallback = (metric: WebVitalMetric) => void;

const thresholds: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  TTFB: [800, 1800],
  FCP: [1800, 3000],
};

function getRating(name: string, value: number): WebVitalMetric['rating'] {
  const [good, poor] = thresholds[name] ?? [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function createMetric(name: WebVitalMetric['name'], value: number): WebVitalMetric {
  return {
    name,
    value: Math.round(value * 100) / 100,
    rating: getRating(name, value),
    timestamp: Date.now(),
  };
}

function observeLCP(onMetric: MetricCallback) {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        onMetric(createMetric('LCP', last.startTime));
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* unsupported */ }
}

function observeFID(onMetric: MetricCallback) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming;
        onMetric(createMetric('FID', fidEntry.processingStart - fidEntry.startTime));
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch { /* unsupported */ }
}

function observeCLS(onMetric: MetricCallback) {
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput && layoutShift.value) {
          clsValue += layoutShift.value;
        }
      }
      onMetric(createMetric('CLS', clsValue));
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch { /* unsupported */ }
}

function observeINP(onMetric: MetricCallback) {
  try {
    let maxDuration = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;
        const duration = eventEntry.duration;
        if (duration > maxDuration) {
          maxDuration = duration;
          onMetric(createMetric('INP', duration));
        }
      }
    });
    observer.observe({ type: 'event', buffered: true });
  } catch { /* unsupported */ }
}

function observeTTFB(onMetric: MetricCallback) {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      onMetric(createMetric('TTFB', nav.responseStart - nav.requestStart));
    }
  } catch { /* unsupported */ }
}

function observeFCP(onMetric: MetricCallback) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          onMetric(createMetric('FCP', entry.startTime));
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch { /* unsupported */ }
}

/** Collected metrics for diagnostics */
const collectedMetrics: WebVitalMetric[] = [];

/**
 * Initialize Web Vitals monitoring.
 * Call once during app bootstrap.
 */
export function initWebVitals(options?: { onMetric?: MetricCallback }) {
  const handleMetric: MetricCallback = (metric) => {
    // Store locally
    const existing = collectedMetrics.findIndex(m => m.name === metric.name);
    if (existing >= 0) {
      collectedMetrics[existing] = metric;
    } else {
      collectedMetrics.push(metric);
    }

    // Log poor metrics in development
    if (import.meta.env.DEV && metric.rating === 'poor') {
      console.warn(`[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`);
    }

    // Forward to callback
    options?.onMetric?.(metric);
  };

  observeLCP(handleMetric);
  observeFID(handleMetric);
  observeCLS(handleMetric);
  observeINP(handleMetric);
  observeTTFB(handleMetric);
  observeFCP(handleMetric);
}

/**
 * Get all collected Web Vitals metrics.
 */
export function getWebVitals(): WebVitalMetric[] {
  return [...collectedMetrics];
}
