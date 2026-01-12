import { useState, useEffect, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useWatch, Control, FieldValues, Path, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

interface ValidatedFormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date';
  required?: boolean;
  helpText?: string;
  className?: string;
  schema?: z.ZodType;
  debounceMs?: number;
  showValidIcon?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export function ValidatedFormField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  required = false,
  helpText,
  className,
  schema,
  debounceMs = 300,
  showValidIcon = true,
  disabled = false,
  autoComplete,
}: ValidatedFormFieldProps<T>) {
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const watchedValue = useWatch({ control, name });
  const debouncedValue = useDebounce(watchedValue, debounceMs);

  // Validate on debounced value change
  useEffect(() => {
    if (!schema || !debouncedValue) {
      if (!debouncedValue && validationState !== 'idle') {
        setValidationState('idle');
        setLocalError(null);
      }
      return;
    }

    setValidationState('validating');

    try {
      schema.parse(debouncedValue);
      setValidationState('valid');
      setLocalError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationState('invalid');
        setLocalError(err.errors[0]?.message || 'Valor inválido');
      }
    }
  }, [debouncedValue, schema, validationState]);

  // Set to validating immediately on change
  useEffect(() => {
    if (watchedValue && schema && validationState === 'idle') {
      setValidationState('validating');
    }
  }, [watchedValue, schema, validationState]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const getStateStyles = () => {
    switch (validationState) {
      case 'validating':
        return 'border-muted-foreground/50';
      case 'valid':
        return 'border-success focus:ring-success/20';
      case 'invalid':
        return 'border-destructive focus:ring-destructive/20';
      default:
        return '';
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          {label && (
            <Label
              htmlFor={name}
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
                    key="validating"
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
                    key="valid"
                  >
                    <Check className="w-3 h-3 text-success" />
                  </motion.span>
                )}
              </AnimatePresence>
            </Label>
          )}

          <div className="relative">
            <Input
              {...field}
              id={name}
              type={inputType}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              className={cn(
                'transition-colors duration-200 pr-10',
                getStateStyles(),
                fieldState.error && 'border-destructive focus:ring-destructive/20'
              )}
              aria-invalid={validationState === 'invalid' || !!fieldState.error}
              aria-describedby={
                fieldState.error || localError
                  ? `${name}-error`
                  : helpText
                  ? `${name}-help`
                  : undefined
              }
            />

            {/* Status icons */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}

              <AnimatePresence mode="wait">
                {validationState === 'valid' && showValidIcon && type !== 'password' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    key="check"
                  >
                    <Check className="w-4 h-4 text-success" />
                  </motion.div>
                )}
                {(validationState === 'invalid' || fieldState.error) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    key="error"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {(fieldState.error || localError) && (
              <motion.p
                id={`${name}-error`}
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                className="text-xs text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {fieldState.error?.message || localError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Help text */}
          {helpText && !fieldState.error && !localError && (
            <p id={`${name}-help`} className="text-xs text-muted-foreground">
              {helpText}
            </p>
          )}
        </div>
      )}
    />
  );
}

// Export validation schemas for common fields
export const fieldSchemas = {
  email: z.string().email('Email inválido'),
  
  phone: z.string()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  
  whatsapp: z.string()
    .regex(/^(\+?55)?[\s-]?\(?[1-9]{2}\)?[\s-]?9[0-9]{4}[\s-]?[0-9]{4}$/, 'WhatsApp deve ter DDD + 9 dígitos')
    .optional()
    .or(z.literal('')),
  
  linkedin: z.string()
    .url('URL inválida')
    .refine((url) => url.includes('linkedin.com'), 'Deve ser um link do LinkedIn')
    .optional()
    .or(z.literal('')),
  
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  
  name: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  shortText: z.string().max(255, 'Texto muito longo'),
  
  longText: z.string().max(5000, 'Texto muito longo'),
  
  required: z.string().min(1, 'Campo obrigatório'),
};
