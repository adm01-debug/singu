import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingButtonProps extends ButtonProps {
  loadingState?: LoadingState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showStateIcon?: boolean;
  resetDelay?: number;
  onReset?: () => void;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    loadingState = 'idle',
    loadingText,
    successText,
    errorText,
    showStateIcon = true,
    resetDelay = 2000,
    onReset,
    disabled,
    className,
    ...props
  }, ref) => {
    const isLoading = loadingState === 'loading';
    const isSuccess = loadingState === 'success';
    const isError = loadingState === 'error';
    const isDisabled = disabled || isLoading;

    // Auto reset after success/error
    if ((isSuccess || isError) && onReset) {
      setTimeout(onReset, resetDelay);
    }

    const getContent = () => {
      if (isLoading) return loadingText || children;
      if (isSuccess) return successText || children;
      if (isError) return errorText || children;
      return children;
    };

    const getIcon = () => {
      if (!showStateIcon) return null;
      
      if (isLoading) {
        return <Loader2 className="w-4 h-4 animate-spin" />;
      }
      if (isSuccess) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-4 h-4" />
          </motion.div>
        );
      }
      if (isError) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <AlertCircle className="w-4 h-4" />
          </motion.div>
        );
      }
      return null;
    };

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          isSuccess && 'bg-success hover:bg-success/90',
          isError && 'bg-destructive hover:bg-destructive/90',
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={loadingState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {getIcon()}
            {getContent()}
          </motion.span>
        </AnimatePresence>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

// Hook for managing loading button state
import { useState, useCallback } from 'react';

export function useLoadingButton() {
  const [state, setState] = useState<LoadingState>('idle');

  const setLoading = useCallback(() => setState('loading'), []);
  const setSuccess = useCallback(() => setState('success'), []);
  const setError = useCallback(() => setState('error'), []);
  const reset = useCallback(() => setState('idle'), []);

  const execute = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      successDelay?: number;
      errorDelay?: number;
    }
  ): Promise<T | null> => {
    setState('loading');
    
    try {
      const result = await asyncFn();
      setState('success');
      
      if (options?.successDelay) {
        setTimeout(reset, options.successDelay);
      }
      
      return result;
    } catch (error) {
      setState('error');
      
      if (options?.errorDelay) {
        setTimeout(reset, options.errorDelay);
      }
      
      return null;
    }
  }, [reset]);

  return {
    state,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
  };
}
