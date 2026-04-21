import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScrollToTopButtonProps {
  className?: string;
  /** Limiar (px) de scrollY para tornar o botão visível. Default 400. */
  threshold?: number;
}

/**
 * Floating scroll-to-top button.
 * - Limiar adaptativo em listas longas (scrollHeight > 4000 → 300px).
 * - Scroll instantâneo em rolagens muito altas (>5000) ou prefers-reduced-motion.
 * - Listener de scroll throttled via requestAnimationFrame.
 * - Hides when overlays (e.g., MobileBottomNav "More") are open.
 */
export function ScrollToTopButton({ className, threshold = 400 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const docHeight = document.documentElement.scrollHeight;
      const effective = docHeight > 4000 ? Math.min(threshold, 300) : threshold;
      setVisible(window.scrollY > effective);
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(compute);
    };

    const handleOverlayOpen = () => setOverlayOpen(true);
    const handleOverlayClose = () => setOverlayOpen(false);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mobile-overlay-open', handleOverlayOpen);
    window.addEventListener('mobile-overlay-close', handleOverlayClose);
    compute();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mobile-overlay-open', handleOverlayOpen);
      window.removeEventListener('mobile-overlay-close', handleOverlayClose);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [threshold]);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tooFar = window.scrollY > 5000;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion || tooFar ? 'auto' : 'smooth',
    });
  };

  const shouldShow = visible && !overlayOpen;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn('z-40', className ?? 'fixed bottom-24 md:bottom-8 right-4 md:right-8')}
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-sm bg-background/90 backdrop-blur-sm border-border/80 hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
