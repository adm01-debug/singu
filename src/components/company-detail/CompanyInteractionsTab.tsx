import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Mail, Globe, Users, Edit, Plus, Clock, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInteractionHistory } from '@/hooks/useInteractionsRpc';
import type { Tables } from '@/integrations/supabase/types';
import type { SentimentType } from '@/types';

type Interaction = Tables<'interactions'>;

const interactionIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-accent text-accent-foreground',
};

interface CompanyInteractionsTabProps {
  interactions: Interaction[];
  companyId?: string;
}

export function CompanyInteractionsTab({ interactions, companyId }: CompanyInteractionsTabProps) {
  const { data: externalHistory } = useInteractionHistory(companyId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {interactions.length > 0 ? (
        <div className="space-y-3">
          {interactions.map((interaction, index) => {
            const Icon = interactionIcons[interaction.type] || MessageSquare;
            const colorClass = interactionColors[interaction.type] || interactionColors.note;
            
            return (
              <motion.div
                key={interaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{interaction.title}</h4>
                          <SentimentIndicator 
                            sentiment={(interaction.sentiment as SentimentType) || 'neutral'} 
                            size="sm" 
                          />
                          {interaction.follow_up_required && (
                            <Badge variant="outline" className="text-warning border-warning">
                              <Clock className="w-3 h-3 mr-1" />
                              Follow-up
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {interaction.content}
                        </p>
                        {interaction.key_insights && interaction.key_insights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {interaction.key_insights.map((insight, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{insight}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(interaction.created_at), "d MMM", { locale: ptBR })}</p>
                        <p>{format(new Date(interaction.created_at), "HH:mm")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma interação registrada</h3>
            <p className="text-muted-foreground mb-4">
              Registre suas interações para manter o histórico de relacionamento.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Interação
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
