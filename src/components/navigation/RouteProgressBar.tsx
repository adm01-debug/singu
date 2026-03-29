import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Thin animated progress bar at the top of the page during route transitions.
 * Inspired by NProgress — starts fast, slows down, then completes on route change.
 */
export function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;

    // Start progress
    setVisible(true);
    setProgress(0);

    // Simulate fast then slow progress
    let current = 0;
    timerRef.current = setInterval(() => {
      current += (95 - current) * 0.1; // Asymptotic approach to 95%
      setProgress(Math.min(current, 95));
    }, 50);

    // Complete after a short delay (simulates page load)
    const completeTimer = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => setVisible(false), 200);
    }, 300);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(completeTimer);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 rounded-r-full shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
