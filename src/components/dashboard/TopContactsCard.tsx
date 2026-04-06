import { Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Surface } from '@/components/ui/surface';
import { Typography } from '@/components/ui/typography';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pluralize } from '@/lib/formatters';
import type { ContactRole, SentimentType } from '@/types';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface TopContactsCardProps {
  contacts: DashboardStats['topContacts'];
  animations: Array<{
    initial: Record<string, unknown>;
    animate: Record<string, unknown>;
    transition: Record<string, unknown>;
    style: Record<string, unknown>;
  }>;
}

export function TopContactsCard({ contacts, animations }: TopContactsCardProps) {
  return (
    <Card className="h-full border-border/60 hover:border-border transition-colors overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success to-primary/60 rounded-t-xl" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-success/15 to-primary/10 ring-1 ring-success/20">
            <Users className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          </div>
          Melhores Relacionamentos
        </CardTitle>
        <Link to="/contatos">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2 pr-2">
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
                    <Link to={`/contatos/${contact.id}`} className="block">
                      <Surface
                        level={1}
                        hoverable
                        rounded="lg"
                        className="flex items-center justify-between p-3 group cursor-pointer hover:border-primary/15"
                      >
                        <div className="flex items-center gap-3">
                          <OptimizedAvatar
                            src={contact.avatar || undefined}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            fallback={`${contact.firstName?.[0] || 'C'}${contact.lastName?.[0] || 'N'}`}
                            size="md"
                            className="w-10 h-10 border-2 border-primary/20 group-hover:border-primary/40 transition-colors"
                          />
                          <div>
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.companyName && (
                              <Typography variant="small" as="p">
                                {contact.companyName}
                              </Typography>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <RoleBadge role={contact.role as ContactRole} />
                              <SentimentIndicator sentiment={contact.sentiment as SentimentType} size="sm" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <Typography variant="small" as="p">
                              {contact.interactionCount > 0 
                                ? pluralize(contact.interactionCount, 'interação', 'interações')
                                : contact.lastInteraction 
                                  ? formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })
                                  : 'Novo contato'}
                            </Typography>
                          </div>
                          <RelationshipScore score={contact.relationshipScore} size="sm" />
                        </div>
                      </Surface>
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
