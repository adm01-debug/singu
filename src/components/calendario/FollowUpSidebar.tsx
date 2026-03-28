import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Building2, MessageSquare } from 'lucide-react';
import { format, isToday, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FollowUp } from './types';
import { interactionTypeIcons, interactionTypeLabels } from './types';

interface FollowUpSidebarProps {
  selectedDate: Date | null;
  followUps: FollowUp[];
  onSelectFollowUp: (followUp: FollowUp) => void;
}

export const FollowUpSidebar = ({
  selectedDate,
  followUps,
  onSelectFollowUp,
}: FollowUpSidebarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50 shadow-lg h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione uma data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <AnimatePresence mode="popLayout">
              {followUps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum follow-up para esta data
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((followUp, index) => {
                    const isOverdue = followUp.follow_up_date && isPast(parseISO(followUp.follow_up_date)) && !isToday(parseISO(followUp.follow_up_date));

                    return (
                      <motion.div
                        key={followUp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                          isOverdue
                            ? 'border-destructive/50 bg-destructive/5 hover:border-destructive'
                            : 'border-border/50 hover:border-primary/50'
                        )}
                        onClick={() => onSelectFollowUp(followUp)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'p-2 rounded-lg',
                              isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                            )}>
                              {interactionTypeIcons[followUp.type] || <MessageSquare className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{followUp.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {interactionTypeLabels[followUp.type] || followUp.type}
                              </p>
                            </div>
                          </div>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Atrasado
                            </Badge>
                          )}
                        </div>

                        {followUp.contact && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{followUp.contact.first_name} {followUp.contact.last_name}</span>
                          </div>
                        )}

                        {followUp.company && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span>{followUp.company.name}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};
