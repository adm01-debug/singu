import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type ProgressToastStatus = 'loading' | 'success' | 'error' | 'cancelled';

interface ProgressToastProps {
  id: string;
  title: string;
  description?: string;
  progress: number;
  total?: number;
  status?: ProgressToastStatus;
  cancelable?: boolean;
  onCancel?: () => void;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export function ProgressToast({
  id,
  title,
  description,
  progress,
  total = 100,
  status = 'loading',
  cancelable = false,
  onCancel,
  onDismiss,
  autoHideDuration = 3000,
}: ProgressToastProps) {
  const [visible, setVisible] = useState(true);
  const percentage = Math.round((progress / total) * 100);

  // Auto hide on success or error
  useEffect(() => {
    if (status === 'success' || status === 'error' || status === 'cancelled') {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [status, autoHideDuration, onDismiss]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />;
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-4 h-4 text-success" aria-hidden="true" />
          </motion.div>
        );
      case 'error':
      case 'cancelled':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
          </motion.div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-success';
      case 'error':
      case 'cancelled':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-24 md:bottom-6 right-4 md:right-6 z-toast",
            "w-[calc(100%-2rem)] md:w-80 p-4 rounded-xl",
            "bg-card border border-border shadow-xl backdrop-blur-sm",
            "flex flex-col gap-3"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{title}</p>
                {description && (
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                )}
              </div>
            </div>
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>

          {/* Progress bar */}
          {status === 'loading' && (
            <div className="space-y-2">
              <Progress value={percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{percentage}%</span>
                {total !== 100 && (
                  <span>{progress} / {total}</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {cancelable && status === 'loading' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="w-full"
            >
              Cancelar
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing progress toasts
interface ProgressToastState {
  id: string;
  title: string;
  description?: string;
  progress: number;
  total: number;
  status: ProgressToastStatus;
  cancelable: boolean;
}

export function useProgressToast() {
  const [toasts, setToasts] = useState<ProgressToastState[]>([]);

  const create = useCallback((options: {
    id?: string;
    title: string;
    description?: string;
    total?: number;
    cancelable?: boolean;
  }) => {
    const id = options.id || `toast-${Date.now()}`;
    
    setToasts(prev => [...prev, {
      id,
      title: options.title,
      description: options.description,
      progress: 0,
      total: options.total || 100,
      status: 'loading',
      cancelable: options.cancelable || false,
    }]);

    return id;
  }, []);

  const update = useCallback((id: string, progress: number) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, progress } : toast
    ));
  }, []);

  const success = useCallback((id: string) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, status: 'success' as ProgressToastStatus, progress: toast.total } : toast
    ));
  }, []);

  const error = useCallback((id: string) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, status: 'error' as ProgressToastStatus } : toast
    ));
  }, []);

  const cancel = useCallback((id: string) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, status: 'cancelled' as ProgressToastStatus } : toast
    ));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toasts,
    create,
    update,
    success,
    error,
    cancel,
    dismiss,
  };
}

export default ProgressToast;
