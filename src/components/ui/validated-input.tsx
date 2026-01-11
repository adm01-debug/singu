import { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  validationState?: ValidationState;
  helpText?: string;
  showValidIcon?: boolean;
  required?: boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error, 
    validationState = 'idle',
    helpText,
    showValidIcon = true,
    required,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

    const stateStyles = {
      idle: '',
      validating: 'border-muted-foreground/50',
      valid: 'border-success focus:ring-success/20',
      invalid: 'border-destructive focus:ring-destructive/20',
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <Label 
            htmlFor={inputId}
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            {label}
            {required && <span className="text-destructive">*</span>}
            <AnimatePresence mode="wait">
              {validationState === 'validating' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </motion.span>
              )}
              {validationState === 'valid' && showValidIcon && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check className="w-3 h-3 text-success" />
                </motion.span>
              )}
            </AnimatePresence>
          </Label>
        )}

        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              'transition-colors duration-200',
              stateStyles[validationState],
              className
            )}
            aria-invalid={validationState === 'invalid'}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />

          {/* Status icon inside input */}
          <AnimatePresence>
            {validationState === 'valid' && showValidIcon && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <Check className="w-4 h-4 text-success" />
              </motion.div>
            )}
            {validationState === 'invalid' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <AlertCircle className="w-4 h-4 text-destructive" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && validationState === 'invalid' && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-xs text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Help text */}
        {helpText && !error && (
          <p 
            id={`${inputId}-help`}
            className="text-xs text-muted-foreground"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Textarea version
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  validationState?: ValidationState;
  helpText?: string;
  showCharCount?: boolean;
  maxLength?: number;
  required?: boolean;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    label, 
    error, 
    validationState = 'idle',
    helpText,
    showCharCount = false,
    maxLength,
    required,
    className,
    id,
    value,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = useState(0);
    const inputId = id || `textarea-${label?.toLowerCase().replace(/\s/g, '-')}`;

    useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const stateStyles = {
      idle: '',
      validating: 'border-muted-foreground/50',
      valid: 'border-success focus:ring-success/20',
      invalid: 'border-destructive focus:ring-destructive/20',
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <Label 
            htmlFor={inputId}
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',
            stateStyles[validationState],
            className
          )}
          aria-invalid={validationState === 'invalid'}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />

        <div className="flex justify-between items-center">
          {/* Error or help text */}
          <AnimatePresence mode="wait">
            {error && validationState === 'invalid' ? (
              <motion.p
                id={`${inputId}-error`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="w-3 h-3" />
                {error}
              </motion.p>
            ) : helpText ? (
              <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
                {helpText}
              </p>
            ) : (
              <span />
            )}
          </AnimatePresence>

          {/* Character count */}
          {showCharCount && maxLength && (
            <span 
              className={cn(
                'text-xs',
                charCount >= maxLength ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';
