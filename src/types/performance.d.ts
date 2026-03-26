// Extended Performance API types for Web Vitals
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
  target: Node | null;
}
