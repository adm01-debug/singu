import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ElementType;
  iconClass: string;
  actionClass: string;
}> = {
  danger: {
    icon: Trash2,
    iconClass: 'text-destructive bg-destructive/10',
    actionClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    actionClass: 'bg-yellow-600 text-white hover:bg-yellow-700',
  },
  info: {
    icon: Info,
    iconClass: 'text-primary bg-primary/10',
    actionClass: '',
  },
};

const ConfirmDialog = React.forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({ open, onOpenChange, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, variant = 'danger', loading = false }, ref) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = () => {
      onConfirm();
      if (!loading) onOpenChange(false);
    };

    const handleCancel = () => {
      onCancel?.();
      onOpenChange(false);
    };

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent ref={ref}>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-full shrink-0', config.iconClass)}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle>{title}</AlertDialogTitle>
                {description && (
                  <AlertDialogDescription>{description}</AlertDialogDescription>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={loading}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={cn(config.actionClass)}
            >
              {loading ? 'Processando...' : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
export type { ConfirmDialogProps, ConfirmVariant };
