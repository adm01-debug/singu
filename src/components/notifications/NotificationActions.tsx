import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Clock, 
  X, 
  MessageSquare, 
  Calendar, 
  CheckCircle2,
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  action: () => void | Promise<void>;
}

interface NotificationActionsProps {
  notificationId: string;
  notificationType: 'follow_up' | 'birthday' | 'insight' | 'health_alert' | 'general';
  contactId?: string;
  onAction?: (actionId: string) => void;
  onDismiss?: () => void;
  onSnooze?: (minutes: number) => void;
  compact?: boolean;
  className?: string;
}

export function NotificationActions({
  notificationId,
  notificationType,
  contactId,
  onAction,
  onDismiss,
  onSnooze,
  compact = false,
  className,
}: NotificationActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (action: NotificationAction) => {
    setIsLoading(action.id);
    try {
      await action.action();
      onAction?.(action.id);
      toast.success(`${action.label} executado`);
    } catch (error) {
      toast.error('Erro ao executar ação');
    } finally {
      setIsLoading(null);
    }
  };

  const handleSnooze = (minutes: number) => {
    onSnooze?.(minutes);
    const label = minutes < 60 
      ? `${minutes} minutos` 
      : minutes === 60 
        ? '1 hora' 
        : `${minutes / 60} horas`;
    toast.success(`Adiado por ${label}`);
  };

  const handleDismiss = () => {
    onDismiss?.();
    toast.success('Notificação dispensada');
  };

  // Build actions based on notification type
  const getActions = (): NotificationAction[] => {
    const baseActions: NotificationAction[] = [];

    if (notificationType === 'follow_up') {
      baseActions.push(
        {
          id: 'call',
          label: 'Ligar agora',
          icon: Phone,
          variant: 'default',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}?action=call`, '_blank');
            }
          },
        },
        {
          id: 'message',
          label: 'Enviar mensagem',
          icon: MessageSquare,
          variant: 'default',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}?action=message`, '_blank');
            }
          },
        },
        {
          id: 'complete',
          label: 'Marcar como feito',
          icon: CheckCircle2,
          variant: 'success',
          action: async () => {
            // Mark follow-up as completed
            onAction?.('complete');
          },
        }
      );
    }

    if (notificationType === 'birthday') {
      baseActions.push(
        {
          id: 'congratulate',
          label: 'Parabenizar',
          icon: MessageSquare,
          variant: 'success',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}?action=birthday`, '_blank');
            }
          },
        },
        {
          id: 'schedule',
          label: 'Agendar lembrete',
          icon: Calendar,
          variant: 'default',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}?action=schedule`, '_blank');
            }
          },
        }
      );
    }

    if (notificationType === 'health_alert') {
      baseActions.push(
        {
          id: 'view',
          label: 'Ver detalhes',
          icon: CheckCircle2,
          variant: 'warning',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}`, '_blank');
            }
          },
        },
        {
          id: 'schedule',
          label: 'Agendar contato',
          icon: Calendar,
          variant: 'default',
          action: () => {
            if (contactId) {
              window.open(`/contatos/${contactId}?action=schedule`, '_blank');
            }
          },
        }
      );
    }

    return baseActions;
  };

  const actions = getActions();

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", className)}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isLoading === action.id}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </DropdownMenuItem>
          ))}
          
          {onSnooze && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSnooze(30)}>
                <Clock className="h-4 w-4 mr-2" />
                Adiar 30 min
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(60)}>
                <Clock className="h-4 w-4 mr-2" />
                Adiar 1 hora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(24 * 60)}>
                <Clock className="h-4 w-4 mr-2" />
                Adiar 1 dia
              </DropdownMenuItem>
            </>
          )}
          
          {onDismiss && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDismiss} className="text-muted-foreground">
                <X className="h-4 w-4 mr-2" />
                Dispensar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <motion.div 
      className={cn("flex items-center gap-2 flex-wrap", className)}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="wait">
        {actions.slice(0, 3).map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={action.variant === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isLoading === action.id}
              className={cn(
                "gap-1.5 text-xs",
                action.variant === 'success' && "bg-success hover:bg-success/90",
                action.variant === 'warning' && "bg-warning hover:bg-warning/90 text-warning-foreground",
                action.variant === 'destructive' && "bg-destructive hover:bg-destructive/90"
              )}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {onSnooze && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Adiar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSnooze(30)}>
              30 minutos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSnooze(60)}>
              1 hora
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSnooze(4 * 60)}>
              4 horas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSnooze(24 * 60)}>
              1 dia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Dispensar
        </Button>
      )}
    </motion.div>
  );
}

export default NotificationActions;
