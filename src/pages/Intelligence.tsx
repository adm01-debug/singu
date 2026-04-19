import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, User, GitCompare, MessageSquare, Activity, Command } from 'lucide-react';
import { GraphTab } from '@/components/intelligence/GraphTab';
import { Entity360Tab, type Entity360Handle } from '@/components/intelligence/Entity360Tab';
import { CrossRefTab } from '@/components/intelligence/CrossRefTab';
import { AskTab } from '@/components/intelligence/AskTab';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelStatusBar } from '@/components/intel/IntelStatusBar';
import { IntelCommandPalette } from '@/components/intel/IntelCommandPalette';
import { IntelDensityToggle } from '@/components/intel/IntelDensityToggle';
import { PinnedEntitiesPanel } from '@/components/intel/PinnedEntitiesPanel';
import { useIntelTelemetry, useIntelTabView } from '@/hooks/useIntelTelemetry';
import { useIntelHotkeys } from '@/hooks/useIntelHotkeys';
import { toast } from 'sonner';

const TABS = [
  { value: 'graph', label: 'Graph', icon: Network, hotkey: 'G' },
  { value: 'entity', label: 'Entity 360', icon: User, hotkey: 'E' },
  { value: 'crossref', label: 'Cross-Ref', icon: GitCompare, hotkey: 'C' },
  { value: 'ask', label: 'Ask', icon: MessageSquare, hotkey: 'A' },
] as const;

type TabValue = typeof TABS[number]['value'];

const isValidTab = (v: string | null): v is TabValue =>
  !!v && TABS.some((t) => t.value === v);

const Intelligence = () => {
  usePageTitle('Intelligence Hub');
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get('tab');
  const tab: TabValue = isValidTab(tabFromUrl) ? tabFromUrl : 'graph';
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const { log } = useIntelTelemetry();
  useIntelTabView(tab, log);

  const setTab = useCallback(
    (next: string) => {
      const np = new URLSearchParams(params);
      np.set('tab', next);
      setParams(np, { replace: true });
    },
    [params, setParams]
  );

  useIntelHotkeys(setTab);

  const entityRef = useRef<Entity360Handle | null>(null);
  const askBridgeRef = useRef<{
    clear: () => void;
    exportLast: () => void;
    help: () => void;
    run: (q: string) => void;
  } | null>(null);

  const registerAskBridge = useCallback(
    (bridge: { clear: () => void; exportLast: () => void; help: () => void; run: (q: string) => void }) => {
      askBridgeRef.current = bridge;
    },
    []
  );

  const openBookmark = useCallback((b: { type: 'contact' | 'company' | 'deal'; id: string; name: string }) => {
    setTab('entity');
    // aguarda render da aba para chamar o ref
    requestAnimationFrame(() => entityRef.current?.open(b));
  }, [setTab]);

  const tabComponents = useMemo(
    () => ({
      graph: <GraphTab />,
      entity: <Entity360Tab ref={entityRef} />,
      crossref: <CrossRefTab />,
      ask: <AskTab onRegisterBridge={registerAskBridge} />,
    }),
    [registerAskBridge]
  );

  return (
    <AppLayout>
      <SEOHead
        title="Intelligence Hub"
        description="Centro de inteligência: grafo, entidade 360, cruzamentos e busca natural"
      />
      <a href="#intel-main" className="intel-skip-link">Pular para o conteúdo</a>
      <IntelCommandPalette
        onChangeTab={setTab}
        onClearAsk={() => {
          if (askBridgeRef.current) {
            askBridgeRef.current.clear();
          } else {
            setTab('ask');
            toast.info('Abra a aba Ask para limpar o console.');
          }
        }}
        onExportAsk={() => {
          if (askBridgeRef.current) askBridgeRef.current.exportLast();
          else toast.info('Abra a aba Ask para exportar.');
        }}
        onHelp={() => askBridgeRef.current?.help()}
      />
      <div className="intel-surface min-h-screen">
        <div className="intel-grid-bg">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-[1600px] mx-auto">
            <header className="flex items-center justify-between mb-4 pb-3 border-b border-border gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-sm border border-[hsl(var(--intel-accent))] bg-[hsl(var(--intel-accent)/0.1)] flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-[hsl(var(--intel-accent))]" aria-hidden />
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
                <IntelDensityToggle />
                <span className="intel-eyebrow flex items-center gap-1">
                  <Command className="h-3 w-3" aria-hidden /> CTRL+P
                </span>
                <span className="intel-eyebrow">SESSION</span>
                <span className="intel-mono text-xs text-foreground">{sessionId}</span>
              </div>
            </header>

            <main id="intel-main" className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
              <div>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                    {TABS.map((t) => {
                      const Icon = t.icon;
                      return (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="intel-mono text-[11px] uppercase gap-1.5"
                          title={`${t.label} (${t.hotkey})`}
                        >
                          <Icon className="h-3 w-3" aria-hidden /> {t.label}
                          <span className="ml-1 opacity-60 hidden sm:inline">[{t.hotkey}]</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {TABS.map((t) =>
                      tab === t.value ? (
                        <TabsContent key={t.value} value={t.value} forceMount>
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                          >
                            {tabComponents[t.value]}
                          </motion.div>
                        </TabsContent>
                      ) : null
                    )}
                  </AnimatePresence>
                </Tabs>
              </div>

              <aside className="hidden lg:block">
                <PinnedEntitiesPanel onOpen={openBookmark} />
              </aside>
            </main>

            <IntelStatusBar />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Intelligence;
