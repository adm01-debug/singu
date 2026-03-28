import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  entityName: string;
  description: string;
  createdAt: Date;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const animations = useStaggerAnimation(activities.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 stagger-children">
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
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium text-foreground">{activity.entityName}</span>
                        <span className="text-muted-foreground"> — {activity.description}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.createdAt, { locale: ptBR, addSuffix: true })}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
