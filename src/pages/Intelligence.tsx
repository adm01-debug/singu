import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, User, GitCompare, MessageSquare, Activity } from 'lucide-react';
import { GraphTab } from '@/components/intelligence/GraphTab';
import { Entity360Tab } from '@/components/intelligence/Entity360Tab';
import { CrossRefTab } from '@/components/intelligence/CrossRefTab';
import { AskTab } from '@/components/intelligence/AskTab';
import { IntelBadge } from '@/components/intel/IntelBadge';

const Intelligence = () => {
  usePageTitle('Intelligence Hub');
  const [tab, setTab] = useState('graph');

  return (
    <AppLayout>
      <SEOHead title="Intelligence Hub" description="Centro de inteligência: grafo, entidade 360, cruzamentos e busca natural" />
      <div className="intel-surface min-h-screen">
        <div className="intel-grid-bg">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-[1600px] mx-auto">
            {/* Command bar */}
            <header className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-sm border border-[hsl(var(--intel-accent))] bg-[hsl(var(--intel-accent)/0.1)] flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-[hsl(var(--intel-accent))]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
                      INTELLIGENCE_HUB
                    </h1>
                    <IntelBadge severity="ok">LIVE</IntelBadge>
                  </div>
                  <p className="intel-mono text-[10px] text-muted-foreground hidden sm:block">
                    OPERATIONAL_VIEW · {new Date().toISOString().slice(0, 19).replace('T', ' ')}Z
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <span className="intel-eyebrow">SESSION</span>
                <span className="intel-mono text-xs text-foreground">{Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
              </div>
            </header>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger value="graph" className="intel-mono text-[11px] uppercase gap-1.5">
                  <Network className="h-3 w-3" /> Graph
                </TabsTrigger>
                <TabsTrigger value="entity" className="intel-mono text-[11px] uppercase gap-1.5">
                  <User className="h-3 w-3" /> Entity 360
                </TabsTrigger>
                <TabsTrigger value="crossref" className="intel-mono text-[11px] uppercase gap-1.5">
                  <GitCompare className="h-3 w-3" /> Cross-Ref
                </TabsTrigger>
                <TabsTrigger value="ask" className="intel-mono text-[11px] uppercase gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Ask
                </TabsTrigger>
              </TabsList>

              <TabsContent value="graph"><GraphTab /></TabsContent>
              <TabsContent value="entity"><Entity360Tab /></TabsContent>
              <TabsContent value="crossref"><CrossRefTab /></TabsContent>
              <TabsContent value="ask"><AskTab /></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Intelligence;
