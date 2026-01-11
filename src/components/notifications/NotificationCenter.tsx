import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle, Lightbulb, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AnimatedBadge } from '@/components/micro-interactions';

const typeConfig = {
  alert: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  insight: {
    icon: Lightbulb,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  health_alert: {
    icon: Heart,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  interaction: {
    icon: Clock,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  contact: {
    icon: Bell,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, clearUnread, dismissNotification } = useRealtimeNotifications();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (notification.entityId && notification.entityType === 'contact') {
      navigate(`/contatos/${notification.entityId}`);
    }
    dismissNotification(notification);
  };

  return (
    <Popover onOpenChange={(open) => open && clearUnread()}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <AnimatedBadge 
            count={unreadCount} 
            className="absolute -top-1 -right-1"
            variant="destructive"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate('/notificacoes')}
              >
                Ver todas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-muted-foreground"
              >
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.slice(0, 10).map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.contact;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 hover:bg-muted/50 cursor-pointer group"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          config.bg
                        )}>
                          <Icon className={cn('h-4 w-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
