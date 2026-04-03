import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sun, 
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useYourDay } from '@/hooks/useYourDay';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const interactionTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  email: MessageSquare,
  whatsapp: MessageSquare,
  note: MessageSquare,
};

const YourDaySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

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
  const greeting = getGreeting();

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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-warning/10">
            <Sun className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {greeting}
            </h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              {totalTasks > 0 && (
                <span className="ml-1.5 text-primary font-medium">
                  · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} para hoje
                </span>
              )}
            </p>
          </div>
        </div>
        <Link to="/calendario">
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            Ver Calendário
          </Button>
        </Link>
      </div>

      {/* No data state */}
      {!hasAnyData && (
        <Card className="border-dashed border-border/50 bg-muted/20">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success/50" />
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Tudo em dia!</h3>
            <p className="text-xs text-muted-foreground">
              Nenhuma tarefa urgente ou follow-up pendente para hoje.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      {hasAnyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Overdue Follow-ups */}
          {overdueFollowUps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-destructive/30 bg-destructive/5 h-full border-l-4 border-l-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Atrasados ({overdueFollowUps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overdueFollowUps.slice(0, 3).map((item, index) => {
                    const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                    return (
                      <Link
                        key={item.interaction.id}
                        to={`/contatos/${item.interaction.contact_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-destructive/10 transition-colors group"
                      >
                        <OptimizedAvatar 
                          src={item.contact?.avatar_url || ''}
                          alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                          fallback={`${item.contact?.first_name?.[0]}${item.contact?.last_name?.[0]}`}
                          size="sm"
                          className="h-9 w-9 border border-destructive/20"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-destructive transition-colors">
                            {item.contact?.first_name} {item.contact?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {item.interaction.title}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs shrink-0">
                          {item.interaction.follow_up_date && 
                            format(parseISO(item.interaction.follow_up_date), 'dd/MM')}
                        </Badge>
                      </Link>
                    );
                  })}
                  {overdueFollowUps.length > 3 && (
                    <Link to="/calendario" className="block">
                      <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive">
                        +{overdueFollowUps.length - 3} mais <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Today's Follow-ups */}
          {todayFollowUps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-primary/30 bg-primary/5 h-full border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    Hoje ({todayFollowUps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayFollowUps.slice(0, 3).map((item) => {
                    const Icon = interactionTypeIcons[item.interaction.type] || MessageSquare;
                    return (
                      <Link
                        key={item.interaction.id}
                        to={`/contatos/${item.interaction.contact_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                      >
                        <OptimizedAvatar 
                          src={item.contact?.avatar_url || ''}
                          alt={`${item.contact?.first_name} ${item.contact?.last_name}`}
                          fallback={`${item.contact?.first_name?.[0]}${item.contact?.last_name?.[0]}`}
                          size="sm"
                          className="h-9 w-9 border border-primary/20"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {item.contact?.first_name} {item.contact?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {item.interaction.title}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  {todayFollowUps.length > 3 && (
                    <Link to="/calendario" className="block">
                      <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary">
                        +{todayFollowUps.length - 3} mais <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Birthdays */}
          {upcomingBirthdays.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-warning/30 bg-warning/5 h-full border-l-4 border-l-warning">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
                    <Cake className="w-4 h-4" />
                    Aniversários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingBirthdays.slice(0, 3).map((item) => (
                    <Link
                      key={item.contact.id}
                      to={`/contatos/${item.contact.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-warning/10 transition-colors group"
                    >
                      <OptimizedAvatar 
                        src={item.contact.avatar_url || ''}
                        alt={`${item.contact.first_name} ${item.contact.last_name}`}
                        fallback={`${item.contact.first_name?.[0]}${item.contact.last_name?.[0]}`}
                        size="sm"
                        className="h-9 w-9 border border-warning/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-warning transition-colors">
                          {item.contact.first_name} {item.contact.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.company?.name || 'Sem empresa'}
                        </p>
                      </div>
                      <Badge 
                        variant={item.daysUntil === 0 ? 'default' : 'secondary'} 
                        className={item.daysUntil === 0 ? 'bg-warning text-warning-foreground' : ''}
                      >
                        {item.daysUntil === 0 ? 'Hoje!' : `${item.daysUntil}d`}
                      </Badge>
                    </Link>
                  ))}
                  {upcomingBirthdays.length > 3 && (
                    <Link to="/contatos" className="block">
                      <Button variant="ghost" size="sm" className="w-full text-warning hover:text-warning">
                        +{upcomingBirthdays.length - 3} mais <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-warning/30 bg-warning/5 h-full border-l-4 border-l-warning">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    Precisam de Atenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {needsAttention.slice(0, 3).map((item) => (
                    <Link
                      key={item.contact.id}
                      to={`/contatos/${item.contact.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                    >
                      <OptimizedAvatar 
                        src={item.contact.avatar_url || ''}
                        alt={`${item.contact.first_name} ${item.contact.last_name}`}
                        fallback={`${item.contact.first_name?.[0]}${item.contact.last_name?.[0]}`}
                        size="sm"
                        className="h-9 w-9 border border-accent/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                          {item.contact.first_name} {item.contact.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.reason}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        item.priority === 'high' ? 'bg-destructive' :
                        item.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                    </Link>
                  ))}
                  {needsAttention.length > 3 && (
                    <Link to="/contatos" className="block">
                      <Button variant="ghost" size="sm" className="w-full text-accent hover:text-accent">
                        +{needsAttention.length - 3} mais <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
          <Link to="/insights">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {newInsights.length} novo{newInsights.length !== 1 ? 's' : ''} insight{newInsights.length !== 1 ? 's' : ''} da IA disponível
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}
