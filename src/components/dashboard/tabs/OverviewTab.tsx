import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Surface } from '@/components/ui/surface';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TopContactsCard } from '@/components/dashboard/TopContactsCard';
import type { DashboardStats } from '@/hooks/useDashboardStats';

const YourDaySection = lazy(() => import('@/components/dashboard/YourDaySection').then(m => ({ default: m.YourDaySection })));
const PreContactBriefing = lazy(() => import('@/components/briefing/PreContactBriefing').then(m => ({ default: m.PreContactBriefing })));

interface OverviewTabProps {
  stats: DashboardStats;
  briefingOpen: boolean;
  setBriefingOpen: (open: boolean) => void;
  prefersReducedMotion: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivityAnimations: Array<{ initial: any; animate: any; transition: any; style: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topContactAnimations: Array<{ initial: any; animate: any; transition: any; style: any }>;
  tabDirection: number;
}

export function OverviewTab({
  stats,
  briefingOpen,
  setBriefingOpen,
  prefersReducedMotion,
  recentActivityAnimations,
  topContactAnimations,
  tabDirection,
}: OverviewTabProps) {
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div
      key={`overview-${tabDirection}`}
      initial={animVariants.initial}
      animate={animVariants.animate}
      transition={animVariants.transition}
      className="space-y-6"
    >
      {/* 1. Stats Grid — most important at-a-glance info */}
      <DashboardStatsGrid stats={stats} prefersReducedMotion={prefersReducedMotion} />

      {/* 2. Your Day */}
      <DashboardErrorBoundary sectionName="Seu Dia">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
          <YourDaySection />
        </Suspense>
      </DashboardErrorBoundary>

      {/* 3. Pre-Contact Briefing */}
      <DashboardErrorBoundary sectionName="Briefing">
        <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-muted-foreground hover:text-primary border-dashed hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Brain className="w-3 h-3 text-primary" />
              </div>
              <span className="font-medium">Briefing Pré-Contato</span>
              <span className="text-[10px] text-muted-foreground/70 ml-1">
                {briefingOpen ? '' : '— clique para expandir'}
              </span>
              {briefingOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
              <PreContactBriefing compact />
            </Suspense>
          </CollapsibleContent>
        </Collapsible>
      </DashboardErrorBoundary>

      {/* 4. Recent Activity + Top Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardErrorBoundary sectionName="Atividade Recente">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          >
            <RecentActivityCard activities={stats.recentActivities} animations={recentActivityAnimations} />
          </motion.div>
        </DashboardErrorBoundary>

        <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: prefersReducedMotion ? 0 : 0.05 }}
            className="lg:col-span-2"
          >
            <TopContactsCard contacts={stats.topContacts} animations={topContactAnimations} />
          </motion.div>
        </DashboardErrorBoundary>
      </div>
    </motion.div>
  );
}
