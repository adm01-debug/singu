import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

/**
 * Hook para monitorar Core Web Vitals em produção.
 * Reporta LCP, INP, CLS, FCP e TTFB apenas em ambiente de produção.
 */
export function useWebVitals() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const reportMetric = (metric: Metric) => {
      // Log para analytics — pode ser substituído por endpoint real
      const entry = {
        name: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
        delta: Math.round(metric.delta),
        id: metric.id,
        navigationType: metric.navigationType,
      };

      // Usar sendBeacon para não bloquear unload
      if (navigator.sendBeacon) {
        // Armazena em sessionStorage para telemetria futura
        const existing = JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
        existing.push(entry);
        sessionStorage.setItem('web-vitals', JSON.stringify(existing.slice(-20)));
      }

      // Console em desenvolvimento para debug
      if (import.meta.env.DEV) {
        logger.info(`[Web Vital] ${metric.name}: ${entry.value} (${metric.rating})`);
      }
    };

    // Importação dinâmica para não impactar bundle inicial
    void import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onCLS(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onFCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, []);
}
