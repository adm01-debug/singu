import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Surface } from '@/components/ui/surface';
import { Typography } from '@/components/ui/typography';
import { EmptyState } from '@/components/ui/empty-state';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ContactRole, SentimentType } from '@/types';

interface TopContact {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  companyName: string;
  role: string;
  sentiment: string;
  interactionCount: number;
  lastInteraction?: Date;
  relationshipScore: number;
}

interface TopContactsCardProps {
  contacts: TopContact[];
}

export const TopContactsCard = ({ contacts }: TopContactsCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const animations = useStaggerAnimation(contacts.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: prefersReducedMotion ? 0 : 0.05 }}
      className="lg:col-span-2"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" aria-hidden="true" />
            Melhores Relacionamentos
          </CardTitle>
          <Link to="/contatos">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 stagger-children">
          {contacts.length === 0 ? (
            <EmptyState
              illustration="contacts"
              title="Nenhum contato"
              description="Adicione contatos para ver seus melhores relacionamentos."
              actions={[
                { label: 'Adicionar contato', onClick: () => {}, variant: 'default' }
              ]}
            />
          ) : (
            contacts.map((contact, index) => {
              const animation = animations[index];

              return (
                <motion.div
                  key={contact.id}
                  initial={animation?.initial}
                  animate={animation?.animate}
                  transition={animation?.transition}
                  style={animation?.style}
                >
                  <Surface
                    level={1}
                    hoverable
                    rounded="lg"
                    className="flex items-center justify-between p-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <OptimizedAvatar
                        src={contact.avatar || undefined}
                        alt={`${contact.firstName} ${contact.lastName}`}
                        fallback={`${contact.firstName?.[0] || 'C'}${contact.lastName?.[0] || 'N'}`}
                        size="md"
                        className="w-12 h-12 border-2 border-primary/20"
                      />
                      <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <Typography variant="small" as="p">
                          {contact.companyName}
                        </Typography>
                        <div className="flex items-center gap-2 mt-1">
                          <RoleBadge role={contact.role as ContactRole} />
                          <SentimentIndicator sentiment={contact.sentiment as SentimentType} size="sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <Typography variant="small" as="p">
                          {contact.interactionCount} interações
                        </Typography>
                        {contact.lastInteraction && (
                          <p className="text-xs text-muted-foreground">
                            Último: {formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <RelationshipScore score={contact.relationshipScore} size="sm" />
                    </div>
                  </Surface>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
