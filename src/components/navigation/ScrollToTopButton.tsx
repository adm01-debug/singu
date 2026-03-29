import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Floating scroll-to-top button.
 * Hides when overlays (e.g., MobileBottomNav "More") are open.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    const handleOverlayOpen = () => setOverlayOpen(true);
    const handleOverlayClose = () => setOverlayOpen(false);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mobile-overlay-open', handleOverlayOpen);
    window.addEventListener('mobile-overlay-close', handleOverlayClose);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mobile-overlay-open', handleOverlayOpen);
      window.removeEventListener('mobile-overlay-close', handleOverlayClose);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm border-border/80 hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
