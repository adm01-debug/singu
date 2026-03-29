import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  /** Duration in seconds */
  duration?: number;
  /** Format function (e.g. toLocaleString, percentage) */
  format?: (n: number) => string;
  className?: string;
  /** Flash color on change */
  flashOnChange?: boolean;
}

/**
 * Smoothly animates between numeric values with spring physics.
 * Optionally flashes a highlight color when the value changes.
 */
export function AnimatedCounter({
  value,
  duration = 0.8,
  format = (n) => Math.round(n).toLocaleString('pt-BR'),
  className,
  flashOnChange = false,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (latest) => format(latest));
  const [displayValue, setDisplayValue] = useState(format(value));
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    spring.set(value);

    if (flashOnChange && prevValue.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value, spring, flashOnChange]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span
      className={cn(
        'tabular-nums transition-colors duration-500',
        flash && 'text-primary',
        className
      )}
    >
      {displayValue}
    </motion.span>
  );
}
