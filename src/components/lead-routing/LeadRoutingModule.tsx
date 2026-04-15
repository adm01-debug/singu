import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, ArrowRightLeft, BarChart3 } from 'lucide-react';
import { usePendingHandoffCount } from '@/hooks/useHandoffQueue';
import { useSalesTeam } from '@/hooks/useSalesTeam';
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
  const { data: members = [] } = useSalesTeam();

  const activeSdrs = Array.isArray(members) ? members.filter((m) => m.role === 'sdr' && m.is_active).length : 0;
  const activeClosers = Array.isArray(members) ? members.filter((m) => m.role === 'closer' && m.is_active).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rodízio de Carteira</h1>
          <p className="text-sm text-muted-foreground">
            Distribuição inteligente de leads entre SDRs e Closers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeSdrs} SDR{activeSdrs !== 1 ? 's' : ''} ativo{activeSdrs !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {activeClosers} Closer{activeClosers !== 1 ? 's' : ''} ativo{activeClosers !== 1 ? 's' : ''}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingCount} handoff{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
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
