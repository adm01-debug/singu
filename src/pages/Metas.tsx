import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';

const GoalsDashboardWidget = lazy(() => import('@/components/gamification/GoalsDashboardWidget'));
const QuotaStatusWidget = lazy(() => import('@/components/gamification/QuotaStatusWidget'));
const LeaderboardWidget = lazy(() => import('@/components/gamification/LeaderboardWidget'));
const BadgesWidget = lazy(() => import('@/components/gamification/BadgesWidget'));
const UserGoalsWidget = lazy(() => import('@/components/gamification/UserGoalsWidget'));

const WidgetSkeleton = () => <Skeleton className="h-[200px] rounded-xl" />;

export default function Metas() {
  return (
    <AppLayout>
      <Helmet>
        <title>Metas & Gamificação | SINGU</title>
        <meta name="description" content="Acompanhe suas metas, conquistas e ranking no SINGU CRM." />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas & Gamificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe seu progresso, conquiste badges e suba no ranking
          </p>
        </div>

        {/* Dashboard Overview */}
        <Suspense fallback={<WidgetSkeleton />}>
          <GoalsDashboardWidget />
        </Suspense>

        {/* Quotas + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <QuotaStatusWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <UserGoalsWidget />
          </Suspense>
        </div>

        {/* Leaderboard + Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <LeaderboardWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <BadgesWidget />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
