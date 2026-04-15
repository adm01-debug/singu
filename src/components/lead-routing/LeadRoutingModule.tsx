import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, ArrowRightLeft, BarChart3 } from 'lucide-react';
import { usePendingHandoffCount } from '@/hooks/useHandoffQueue';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SalesTeamTab = lazy(() => import('./tabs/SalesTeamTab'));
const RoutingRulesTab = lazy(() => import('./tabs/RoutingRulesTab'));
const HandoffQueueTab = lazy(() => import('./tabs/HandoffQueueTab'));
const RoutingMetricsTab = lazy(() => import('./tabs/RoutingMetricsTab'));

const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-full" />
    ))}
  </div>
);

export default function LeadRoutingModule() {
  const [activeTab, setActiveTab] = useState('team');
  const { data: pendingCount = 0 } = usePendingHandoffCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rodízio de Carteira</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de distribuição de leads entre SDRs e Closers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Regras</span>
          </TabsTrigger>
          <TabsTrigger value="handoff" className="flex items-center gap-2 relative">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Handoff</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<TabSkeleton />}>
          <TabsContent value="team">
            <SalesTeamTab />
          </TabsContent>
          <TabsContent value="rules">
            <RoutingRulesTab />
          </TabsContent>
          <TabsContent value="handoff">
            <HandoffQueueTab />
          </TabsContent>
          <TabsContent value="metrics">
            <RoutingMetricsTab />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
