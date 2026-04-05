import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatContactName, toTitleCase, getContactInitials } from '@/lib/formatters';
import { 
  Calendar, 
  Cake, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useYourDay } from '@/hooks/useYourDay';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const interactionTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  email: MessageSquare,
  whatsapp: MessageSquare,
  note: MessageSquare,
};

const YourDaySkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    ))}
  </div>
);

interface SectionHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  colorClass: string;
}

function SectionHeader({ icon: Icon, label, count, colorClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn('w-1.5 h-1.5 rounded-full', colorClass)} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn('text-xs font-bold', colorClass.replace('bg-', 'text-'))}>
        {count}
      </span>
    </div>
  );
}

interface YourDaySectionProps {
  className?: string;
}

export function YourDaySection({ className }: YourDaySectionProps) {
  const {
    todayFollowUps,
    overdueFollowUps,
    upcomingBirthdays,
    needsAttention,
    newInsights,
    loading,
  } = useYourDay();

  const totalTasks = todayFollowUps.length + overdueFollowUps.length;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <YourDaySkeleton />
      </motion.div>
    );
  }

  const hasAnyData = 
    todayFollowUps.length > 0 || 
    overdueFollowUps.length > 0 || 
    upcomingBirthdays.length > 0 || 
    needsAttention.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Seu dia
          </h2>
          {totalTasks > 0 && (
            <span className="text-xs text-muted-foreground">
              · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link to="/calendario">
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </Button>
        </Link>
      </div>

      {/* No data state */}
      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-xl border border-dashed border-success/20 bg-success/5 py-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success/60" />
          </motion.div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Tudo em dia! 🎉</h3>
          <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
            Nenhuma tarefa urgente ou follow-up pendente. Aproveite para fortalecer seus relacionamentos.
          </p>
          <Link to="/contatos" className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-primary hover:underline">
            Ver contatos
            <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      )}

      {/* Unified list layout */}
      {hasAnyData && (
        <div className="space-y-5">
          {/* Overdue Follow-ups */}
          {overdueFollowUps.length > 0 && (
            <div>
              <SectionHeader icon={AlertCircle} label="Atrasados" count={overdueFollowUps.length} colorClass="bg-destructive" />
              <div className="space-y-1">
                {overdueFollowUps.slice(0, 3).map((item, idx) => {
                  const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                  return (
                    <motion.div
                      key={item.interaction.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                    >
                     <Link
                      to={`/contatos/${item.interaction.contact_id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <OptimizedAvatar 
                        src={item.contact?.avatar_url || undefined}
                        alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                        fallback={getContactInitials(item.contact?.first_name, item.contact?.last_name)}
                        size="sm"
                        className="h-8 w-8"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {formatContactName(item.contact?.first_name, item.contact?.last_name)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {item.interaction.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.contact?.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`tel:${item.contact!.phone}`, '_blank');
                            }}
                            aria-label="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        )}
                        {item.contact?.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const num = item.contact!.whatsapp!.replace(/\D/g, '');
                              window.open(`https://wa.me/${num}`, '_blank');
                            }}
                            aria-label="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-success" />
                          </Button>
                        )}
                        <Badge variant="outline" className="text-[10px] font-medium border-destructive/30 text-destructive shrink-0">
                          {item.interaction.follow_up_date && 
                            format(parseISO(item.interaction.follow_up_date), 'dd/MM')}
                        </Badge>
                      </div>
                    </Link>
                    </motion.div>
                  );
                })}
                {overdueFollowUps.length > 3 && (
                  <Link to="/calendario" className="flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    +{overdueFollowUps.length - 3} mais <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Today's Follow-ups */}
          {todayFollowUps.length > 0 && (
            <div>
              <SectionHeader icon={Clock} label="Hoje" count={todayFollowUps.length} colorClass="bg-primary" />
              <div className="space-y-1">
                {todayFollowUps.slice(0, 3).map((item, idx) => {
                  const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                  return (
                    <motion.div
                      key={item.interaction.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                    >
                     <Link
                      to={`/contatos/${item.interaction.contact_id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <OptimizedAvatar 
                        src={item.contact?.avatar_url || undefined}
                        alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                        fallback={getContactInitials(item.contact?.first_name, item.contact?.last_name)}
                        size="sm"
                        className="h-8 w-8"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {formatContactName(item.contact?.first_name, item.contact?.last_name)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {item.interaction.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.contact?.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`tel:${item.contact!.phone}`, '_blank');
                            }}
                            aria-label="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        )}
                        {item.contact?.whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const num = item.contact!.whatsapp!.replace(/\D/g, '');
                              window.open(`https://wa.me/${num}`, '_blank');
                            }}
                            aria-label="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-success" />
                          </Button>
                        )}
                      </div>
                    </Link>
                  );
                })}
                {todayFollowUps.length > 3 && (
                  <Link to="/calendario" className="flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    +{todayFollowUps.length - 3} mais <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Birthdays */}
          {upcomingBirthdays.length > 0 && (
            <div>
              <SectionHeader icon={Cake} label="Aniversários" count={upcomingBirthdays.length} colorClass="bg-warning" />
              <div className="space-y-1">
                {upcomingBirthdays.slice(0, 3).map((item) => (
                  <Link
                    key={item.contact.id}
                    to={`/contatos/${item.contact.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <OptimizedAvatar 
                      src={item.contact.avatar_url || undefined}
                      alt={`${item.contact.first_name} ${item.contact.last_name}`}
                      fallback={getContactInitials(item.contact.first_name, item.contact.last_name)}
                      size="sm"
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {formatContactName(item.contact.first_name, item.contact.last_name)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {toTitleCase(item.company?.name || '') || 'Sem empresa'}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      item.daysUntil === 0 
                        ? 'bg-warning/15 text-warning' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {item.daysUntil === 0 ? 'Hoje!' : `${item.daysUntil}d`}
                    </span>
                  </Link>
                ))}
                {upcomingBirthdays.length > 3 && (
                  <Link to="/contatos" className="flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    +{upcomingBirthdays.length - 3} mais <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <div>
              <SectionHeader icon={AlertTriangle} label="Precisam de atenção" count={needsAttention.length} colorClass="bg-warning" />
              <div className="space-y-1">
                {needsAttention.slice(0, 3).map((item) => (
                  <Link
                    key={item.contact.id}
                    to={`/contatos/${item.contact.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <OptimizedAvatar 
                      src={item.contact.avatar_url || undefined}
                      alt={`${item.contact.first_name} ${item.contact.last_name}`}
                      fallback={getContactInitials(item.contact.first_name, item.contact.last_name)}
                      size="sm"
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {formatContactName(item.contact.first_name, item.contact.last_name)}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.reason}
                      </p>
                    </div>
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      item.priority === 'high' ? 'bg-destructive' :
                      item.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground/40'
                    )} />
                  </Link>
                ))}
                {needsAttention.length > 3 && (
                  <Link to="/contatos" className="flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    +{needsAttention.length - 3} mais <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Insights Banner */}
      {newInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Link 
            to="/insights"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 hover:bg-primary/8 border border-primary/10 hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {newInsights.length} novo{newInsights.length !== 1 ? 's' : ''} insight{newInsights.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
