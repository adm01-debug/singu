import { Clock, Phone, Mail, Video, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface RecentActivityCardProps {
  activities: DashboardStats['recentActivities'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animations: Array<{ initial: any; animate: any; transition: any; style: any }>;
}

function ActivityIcon({ type }: { type: string }) {
  const iconWrapClass = "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ring-1";
  const iconClass = "w-4 h-4";
  switch (type) {
    case 'call': return <div className={`${iconWrapClass} bg-success/10 ring-success/20`}><Phone className={`${iconClass} text-success`} /></div>;
    case 'email': return <div className={`${iconWrapClass} bg-info/10 ring-info/20`}><Mail className={`${iconClass} text-info`} /></div>;
    case 'meeting': return <div className={`${iconWrapClass} bg-accent/10 ring-accent/20`}><Video className={`${iconClass} text-accent`} /></div>;
    default: return <div className={`${iconWrapClass} bg-primary/10 ring-primary/20`}><MessageSquare className={`${iconClass} text-primary`} /></div>;
  }
}

export function RecentActivityCard({ activities, animations }: RecentActivityCardProps) {
  return (
    <Card className="h-full border-border/60 hover:border-border transition-colors overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent/60 rounded-t-xl" />
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 ring-1 ring-primary/20">
            <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </div>
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2 pr-2">
            {activities.length === 0 ? (
              <EmptyState
                illustration="interactions"
                title="Nenhuma atividade"
                description="Suas atividades recentes aparecerão aqui."
              />
            ) : (
              activities.map((activity, index) => {
                const animation = animations[index];
                return (
                  <motion.div
                    key={activity.id}
                    initial={animation?.initial}
                    animate={animation?.animate}
                    transition={animation?.transition}
                    style={animation?.style}
                  >
                    <Link
                      to={`/contatos/${activity.contactId}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group cursor-pointer"
                    >
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">{activity.entityName}</span>
                          <span className="text-muted-foreground"> — {activity.description}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground/80 whitespace-nowrap flex-shrink-0 ml-2 tabular-nums">
                        {formatDistanceToNow(activity.createdAt, { locale: ptBR, addSuffix: true })}
                      </span>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
