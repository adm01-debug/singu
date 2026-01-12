import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface DraftRecoveryBannerProps {
  /** Whether to show the banner */
  show: boolean;
  /** Callback when user wants to restore draft */
  onRestore: () => void;
  /** Callback when user wants to discard draft */
  onDiscard: () => void;
  /** Custom message */
  message?: string;
}

export function DraftRecoveryBanner({
  show,
  onRestore,
  onDiscard,
  message = 'Rascunho encontrado. Deseja recuperar?',
}: DraftRecoveryBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-warning-foreground">
              <FileText className="w-4 h-4 text-warning" />
              <span className="text-sm">{message}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Descartar
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onRestore}
                className="text-xs h-7 px-3"
              >
                Restaurar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DraftRecoveryBanner;
