import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

async function sha1(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function usePasswordBreachCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [breachCount, setBreachCount] = useState<number | null>(null);

  const checkPassword = useCallback(async (password: string): Promise<number> => {
    setIsChecking(true);
    try {
      const hash = await sha1(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) { setBreachCount(0); return 0; }

      const text = await res.text();
      const match = text.split('\n').find(line => line.startsWith(suffix));
      const count = match ? parseInt(match.split(':')[1], 10) : 0;
      setBreachCount(count);
      return count;
    } catch (err) {
      logger.warn('[HIBP] Check failed:', err);
      setBreachCount(0);
      return 0;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => setBreachCount(null), []);

  return { checkPassword, isChecking, breachCount, isBreached: (breachCount ?? 0) > 0, reset };
}
