import { motion } from 'framer-motion';
import { Phone, Brain, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { NLPBriefing } from '@/hooks/usePreContactBriefing';
import { interactionTypeIcons } from './briefing-constants';

interface BriefingUpcomingListProps {
  briefings: NLPBriefing[];
  onShowBriefing: (interactionId: string) => void;
  className?: string;
}

export function BriefingUpcomingList({ briefings, onShowBriefing, className }: BriefingUpcomingListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Brain className="w-4 h-4" />
            Briefings Próximos
            <Badge variant="secondary" className="ml-auto">
              {briefings.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {briefings.map((briefing) => {
            const Icon = interactionTypeIcons[briefing.interaction.type] || Phone;
            return (
              <motion.div
                key={briefing.interaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group border border-transparent hover:border-primary/20"
                onClick={() => onShowBriefing(briefing.interaction.id)}
              >
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarImage src={briefing.contact.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {briefing.contact.first_name?.[0]}{briefing.contact.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {briefing.contact.first_name} {briefing.contact.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {briefing.interaction.title}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant={briefing.minutesUntilMeeting <= 15 ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {briefing.minutesUntilMeeting} min
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Clique para briefing
                  </p>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
