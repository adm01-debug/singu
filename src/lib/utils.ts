import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Detect macOS using userAgentData (modern) with navigator.platform fallback */
export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uad = (navigator as any).userAgentData;
  if (uad?.platform) return uad.platform === 'macOS';
  return /mac/i.test(navigator.platform);
}
