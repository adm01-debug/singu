import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, User, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { categoryIcons, categoryColors, categoryLabels, priorityColors } from './types';
import type { AIInsight } from './types';

interface InsightCardProps {
  insight: AIInsight;
  index: number;
  contactName: string | null;
}

export const InsightCard = ({ insight, index, contactName }: InsightCardProps) => {
  const Icon = categoryIcons[insight.category] || Lightbulb;

  return (
    <motion.div
      key={`${insight.title}-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl transition-transform group-hover:scale-110",
              categoryColors[insight.category]?.split(' ')[0] || 'bg-primary/10'
            )}>
              <Icon className={cn(
                "w-5 h-5",
                categoryColors[insight.category]?.split(' ')[1] || 'text-primary'
              )} />
            </div>
            <div className="flex items-center gap-2">
              {insight.priority && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", priorityColors[insight.priority])}
                >
                  {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn("text-xs", categoryColors[insight.category])}
              >
                {categoryLabels[insight.category] || insight.category}
              </Badge>
            </div>
          </div>

          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {insight.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {insight.description}
          </p>

          {insight.action_suggestion && (
            <div className="p-3 rounded-lg bg-muted/50 mb-4">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {insight.action_suggestion}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4">
              {contactName && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{contactName}</span>
                </div>
              )}
              {insight.actionable && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Acionável
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confiança</span>
              <div className="w-16">
                <Progress value={insight.confidence} className="h-1.5" />
              </div>
              <span className="text-xs font-medium">{insight.confidence}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
