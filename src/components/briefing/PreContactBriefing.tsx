import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Phone,
  X,
  Clock,
  Brain,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { usePreContactBriefing } from '@/hooks/usePreContactBriefing';
import { NeuroBriefingCard } from '@/components/neuromarketing';
import { cn } from '@/lib/utils';
import { interactionTypeIcons } from './briefing-constants';
import { BriefingCompactList } from './BriefingCompactList';
import { BriefingUpcomingList } from './BriefingUpcomingList';
import { BriefingQuickStats } from './BriefingQuickStats';
import { BriefingCollapsibleSections } from './BriefingCollapsibleSections';
import { BriefingObjections, BriefingClosingReadiness, BriefingFooterBar } from './BriefingFooterSection';

interface PreContactBriefingProps {
  className?: string;
  compact?: boolean;
}

export function PreContactBriefing({ className, compact = false }: PreContactBriefingProps) {
  const { upcomingBriefings, activeBriefing, loading, dismissBriefing, showBriefingFor } = usePreContactBriefing();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tips', 'words']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return null;
  }

  if (upcomingBriefings.length === 0 && !activeBriefing) {
    return null;
  }

  // Compact view - just shows upcoming meetings as cards
  if (compact && !activeBriefing) {
    return (
      <BriefingCompactList
        briefings={upcomingBriefings}
        onShowBriefing={showBriefingFor}
        className={className}
      />
    );
  }

  // Active briefing - full 30-second view
  if (activeBriefing) {
    const briefing = activeBriefing;
    const Icon = interactionTypeIcons[briefing.interaction.type] || Phone;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className={cn("fixed inset-x-4 top-20 z-50 max-w-2xl mx-auto", className)}
        >
          <Card className="shadow-2xl border-2 border-primary/30 bg-background/95 backdrop-blur-lg">
            {/* Header */}
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/30">
                      <AvatarImage src={briefing.contact.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {briefing.contact.first_name?.[0]}{briefing.contact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground">
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {briefing.contact.first_name} {briefing.contact.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {briefing.company?.name || briefing.contact.role_title || 'Contato'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-primary/10 text-primary border-primary/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Em {briefing.minutesUntilMeeting} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {briefing.interaction.title}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/contatos/${briefing.contact.id}`}>
                    <Button variant="ghost" size="sm">
                      <User className="w-4 h-4 mr-1" />
                      Perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissBriefing(briefing.interaction.id)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              <BriefingQuickStats briefing={briefing} />

              {/* Neuro Briefing Card - Quick Neural Summary */}
              <NeuroBriefingCard
                contactName={`${briefing.contact.first_name} ${briefing.contact.last_name}`}
                discProfile={briefing.discProfile?.type !== 'N/A' ? briefing.discProfile?.type : null}
                interactions={[]}
              />

              <Separator />

              <BriefingCollapsibleSections
                briefing={briefing}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />

              <BriefingObjections objections={briefing.recentObjections} />
              <BriefingClosingReadiness closingMoment={briefing.closingMoment} />
            </CardContent>

            <BriefingFooterBar onDismiss={() => dismissBriefing(briefing.interaction.id)} />
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // List of upcoming briefings (when no active)
  return (
    <BriefingUpcomingList
      briefings={upcomingBriefings}
      onShowBriefing={showBriefingFor}
      className={className}
    />
  );
}
