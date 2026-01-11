import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Timer,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useContactCadence, CadenceAlert } from '@/hooks/useContactCadence';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContactCadencePanelProps {
  compact?: boolean;
  className?: string;
}

const statusConfig = {
  overdue: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    label: 'Atrasado',
  },
  due_today: {
    icon: Clock,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    label: 'Hoje',
  },
  due_soon: {
    icon: Timer,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    label: 'Em breve',
  },
  on_track: {
    icon: CheckCircle,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    label: 'Em dia',
  },
};

export function ContactCadencePanel({ compact = false, className }: ContactCadencePanelProps) {
  const { alerts, cadences, loading, refresh } = useContactCadence();
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (loading) {
    return null;
  }

  const overdueCount = alerts.filter(a => a.status === 'overdue').length;
  const dueTodayCount = alerts.filter(a => a.status === 'due_today').length;
  const dueSoonCount = alerts.filter(a => a.status === 'due_soon').length;

  const totalWithCadence = cadences.length;
  const onTrackCount = totalWithCadence - overdueCount - dueTodayCount - dueSoonCount;
  const healthPercentage = totalWithCadence > 0 ? (onTrackCount / totalWithCadence) * 100 : 100;

  if (totalWithCadence === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-6 text-center">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium text-foreground mb-1">Configure Cadências</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Defina a frequência ideal de contato para cada cliente
          </p>
          <Link to="/contatos">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Cadência de Relacionamento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {compact && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Health Bar */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saúde da Cadência</span>
            <span className={cn(
              "font-medium",
              healthPercentage >= 70 ? "text-success" :
              healthPercentage >= 40 ? "text-warning" : "text-destructive"
            )}>
              {Math.round(healthPercentage)}%
            </span>
          </div>
          <Progress 
            value={healthPercentage} 
            className="h-2"
          />
          <div className="flex items-center gap-4 text-xs">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <span className="w-2 h-2 rounded-full bg-warning" />
                {dueTodayCount} para hoje
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {dueSoonCount} em breve
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-2 max-h-[300px] overflow-y-auto">
              {alerts.slice(0, compact ? 5 : 10).map((alert) => (
                <CadenceAlertItem key={alert.cadence.id} alert={alert} />
              ))}

              {alerts.length > (compact ? 5 : 10) && (
                <Link to="/contatos">
                  <Button variant="ghost" size="sm" className="w-full text-primary">
                    Ver todos ({alerts.length})
                  </Button>
                </Link>
              )}

              {alerts.length === 0 && (
                <div className="py-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success/60" />
                  <p className="text-sm text-muted-foreground">
                    Todas as cadências em dia!
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function CadenceAlertItem({ alert }: { alert: CadenceAlert }) {
  const config = statusConfig[alert.status];
  const Icon = config.icon;

  const getTimeLabel = () => {
    if (alert.status === 'overdue') {
      return `${alert.daysOverdue} dia${alert.daysOverdue !== 1 ? 's' : ''} atrasado`;
    }
    if (alert.status === 'due_today') {
      return 'Contatar hoje!';
    }
    if (alert.status === 'due_soon') {
      return `Em ${alert.daysOverdue} dia${alert.daysOverdue !== 1 ? 's' : ''}`;
    }
    return 'Em dia';
  };

  return (
    <Link to={`/contatos/${alert.contact?.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
          config.bg,
          config.border
        )}
      >
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={alert.contact?.avatar_url || ''} />
          <AvatarFallback className={cn(config.bg, config.color, "text-xs font-medium")}>
            {alert.contact?.first_name?.[0]}{alert.contact?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {alert.contact?.first_name} {alert.contact?.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {alert.company?.name || 'Sem empresa'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("text-xs", config.color, config.bg)}>
            <Icon className="w-3 h-3 mr-1" />
            {getTimeLabel()}
          </Badge>
        </div>
      </motion.div>
    </Link>
  );
}
