import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'email' | 'url' | 'tel';
  maxLength?: number;
  minLength?: number;
  className?: string;
  displayClassName?: string;
  editClassName?: string;
  validation?: (value: string) => string | null;
  emptyText?: string;
  disabled?: boolean;
}

export function InlineEditField({
  value,
  onSave,
  label,
  placeholder = 'Clique para editar',
  type = 'text',
  maxLength,
  minLength,
  className,
  displayClassName,
  editClassName,
  validation,
  emptyText = 'Não definido',
  disabled = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  }, [disabled, value]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    // Validation
    if (minLength && editValue.length < minLength) {
      setError(`Mínimo ${minLength} caracteres`);
      return;
    }

    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      toast.success('Atualizado com sucesso');
    } catch (err) {
      setError('Erro ao salvar');
      toast.error('Erro ao salvar alteração');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, minLength, validation, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [type, handleSave, handleCancel]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={cn('relative', className)}
      >
        {label && (
          <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
        )}
        <div className="flex items-start gap-2">
          {type === 'textarea' ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                'min-h-[80px] resize-none',
                error && 'border-destructive',
                editClassName
              )}
              disabled={isSaving}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                error && 'border-destructive',
                editClassName
              )}
              disabled={isSaving}
            />
          )}
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-destructive mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {maxLength && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {editValue.length}/{maxLength}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'group cursor-pointer relative',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      onClick={handleStartEdit}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      {label && (
        <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      )}
      <div className={cn(
        'flex items-center justify-between rounded-md px-2 py-1.5 -mx-2',
        'transition-colors duration-200',
        !disabled && 'group-hover:bg-muted/50',
        displayClassName
      )}>
        <span className={cn(
          !value && 'text-muted-foreground italic'
        )}>
          {value || emptyText}
        </span>
        {!disabled && (
          <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </motion.div>
  );
}
