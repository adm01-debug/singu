import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  renderTime: number | null;
  interactionCount: number;
  errorCount: number;
  slowInteractions: number;
}

interface PerformanceEntry {
  name: string;
  value: number;
  timestamp: number;
}

export function usePerformanceMonitor(pageName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    renderTime: null,
    interactionCount: 0,
    errorCount: 0,
    slowInteractions: 0,
  });

  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const startTime = useRef(performance.now());
  const interactionThreshold = 100; // ms for slow interaction

  // Track render time
  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  // Observe Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    // FCP Observer
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find(e => e.name === 'first-contentful-paint');
        if (fcp) {
          setMetrics(prev => ({ ...prev, fcp: fcp.startTime }));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch (e) {
      console.debug('FCP observer not supported');
    }

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[0] as unknown as { processingStart?: number; startTime: number };
        if (fid && typeof fid.processingStart === 'number') {
          const fidValue = fid.processingStart - fid.startTime;
          setMetrics(prev => ({ ...prev, fid: fidValue }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch (e) {
      console.debug('FID observer not supported');
    }

    // CLS Observer
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput && typeof layoutShift.value === 'number') {
            clsValue += layoutShift.value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {
      console.debug('CLS observer not supported');
    }

    // TTFB from Navigation Timing
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        setMetrics(prev => ({ ...prev, ttfb: navEntry.responseStart - navEntry.requestStart }));
      }
    } catch (e) {
      console.debug('Navigation timing not supported');
    }

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, []);

  // Track custom performance entry
  const trackEntry = useCallback((name: string, value: number) => {
    const entry: PerformanceEntry = {
      name,
      value,
      timestamp: Date.now(),
    };
    setEntries(prev => [...prev, entry]);
  }, []);

  // Track interaction
  const trackInteraction = useCallback((duration: number) => {
    setMetrics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      slowInteractions: duration > interactionThreshold 
        ? prev.slowInteractions + 1 
        : prev.slowInteractions,
    }));
  }, [interactionThreshold]);

  // Track error
  const trackError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
    }));
  }, []);

  // Calculate performance score (simplified version of Lighthouse)
  const performanceScore = useMemo(() => {
    const scores: number[] = [];

    // FCP score (good < 1.8s, needs improvement < 3s)
    if (metrics.fcp !== null) {
      if (metrics.fcp < 1800) scores.push(100);
      else if (metrics.fcp < 3000) scores.push(75);
      else scores.push(50);
    }

    // LCP score (good < 2.5s, needs improvement < 4s)
    if (metrics.lcp !== null) {
      if (metrics.lcp < 2500) scores.push(100);
      else if (metrics.lcp < 4000) scores.push(75);
      else scores.push(50);
    }

    // FID score (good < 100ms, needs improvement < 300ms)
    if (metrics.fid !== null) {
      if (metrics.fid < 100) scores.push(100);
      else if (metrics.fid < 300) scores.push(75);
      else scores.push(50);
    }

    // CLS score (good < 0.1, needs improvement < 0.25)
    if (metrics.cls !== null) {
      if (metrics.cls < 0.1) scores.push(100);
      else if (metrics.cls < 0.25) scores.push(75);
      else scores.push(50);
    }

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [metrics]);

  // Log metrics to console in development
  const logMetrics = useCallback(() => {
    console.group(`📊 Performance Metrics${pageName ? ` - ${pageName}` : ''}`);
    console.log('FCP:', metrics.fcp?.toFixed(2), 'ms');
    console.log('LCP:', metrics.lcp?.toFixed(2), 'ms');
    console.log('FID:', metrics.fid?.toFixed(2), 'ms');
    console.log('CLS:', metrics.cls?.toFixed(4));
    console.log('TTFB:', metrics.ttfb?.toFixed(2), 'ms');
    console.log('Render Time:', metrics.renderTime?.toFixed(2), 'ms');
    console.log('Score:', performanceScore);
    console.groupEnd();
  }, [metrics, performanceScore, pageName]);

  return {
    metrics,
    entries,
    performanceScore,
    trackEntry,
    trackInteraction,
    trackError,
    logMetrics,
  };
}

// Type declarations for PerformanceEventTiming and LayoutShift
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
