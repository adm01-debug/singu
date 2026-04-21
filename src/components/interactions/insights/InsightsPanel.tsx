import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, MessageCircle, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { useInteractionsInsights, type Period, type ThemeAggregate } from "@/hooks/useInteractionsInsights";
import type { SentimentOverall } from "@/hooks/useConversationIntel";
import { SentimentDistributionChart } from "./SentimentDistributionChart";
import { SentimentTrendChart } from "./SentimentTrendChart";
import { ThemesRanking } from "./ThemesRanking";
import { ObjectionsRanking } from "./ObjectionsRanking";
import { ThemeExamplesDrawer } from "./ThemeExamplesDrawer";
import { SentimentExamplesDrawer } from "./SentimentExamplesDrawer";

const PERIOD_LABEL: Record<string, string> = { positive: "Positivo", neutral: "Neutro", negative: "Negativo", mixed: "Misto" };

function isPeriod(v: string | null): v is Period {
  return v === "7d" || v === "30d" || v === "90d";
}

export function InsightsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get("periodo");
  const period: Period = isPeriod(periodParam) ? periodParam : "30d";

  const handlePeriod = useCallback((p: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("periodo", p);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { kpis, sentimentDistribution, sentimentTrend, topThemes, topObjections, sentimentBuckets, isLoading } = useInteractionsInsights(period);
  const [selectedTheme, setSelectedTheme] = useState<ThemeAggregate | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<SentimentOverall | null>(null);

  // Fechar drawer ao trocar período
  useEffect(() => { setSelectedBucket(null); setSelectedTheme(null); }, [period]);

  const isEmpty = !isLoading && kpis.totalAnalyzed === 0;

  return (
    <div className="space-y-4">
      {/* Header com período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Insights de Conversas</h2>
          <Badge variant="outline" className="text-[10px]">IA · Gemini</Badge>
        </div>
        <Tabs value={period} onValueChange={handlePeriod}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs h-6 px-3">7 dias</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs h-6 px-3">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs h-6 px-3">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-semibold text-foreground">Sem análises no período</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Análises são geradas automaticamente para interações com transcrição (chamadas, reuniões e notas com mais de 100 caracteres). Registre uma interação com conteúdo para começar.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isEmpty && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={MessageCircle} label="Conversas analisadas" value={kpis.totalAnalyzed} />
            <KpiCard
              icon={TrendingUp}
              label="Sentimento dominante"
              value={kpis.dominantSentiment ? PERIOD_LABEL[kpis.dominantSentiment] : "—"}
              hint={kpis.dominantSentiment ? `${kpis.dominantPct}% das conversas` : undefined}
            />
            <KpiCard icon={Brain} label="Coaching score médio" value={`${kpis.avgCoachingScore}/100`} />
            <KpiCard
              icon={AlertTriangle}
              label="Objeções não tratadas"
              value={kpis.unhandledObjections}
              variant={kpis.unhandledObjections > 0 ? "warning" : "default"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Distribuição de sentimento</CardTitle></CardHeader>
              <CardContent><SentimentDistributionChart data={sentimentDistribution} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Tendência semanal</CardTitle></CardHeader>
              <CardContent><SentimentTrendChart data={sentimentTrend} /></CardContent>
            </Card>
          </div>

          {/* Themes & Objections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Temas mais discutidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemesRanking themes={topThemes} onSelect={setSelectedTheme} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Objeções recorrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ObjectionsRanking objections={topObjections} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <ThemeExamplesDrawer theme={selectedTheme} onClose={() => setSelectedTheme(null)} />
    </div>
  );
}

interface KpiProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "warning";
}

function KpiCard({ icon: Icon, label, value, hint, variant = "default" }: KpiProps) {
  return (
    <Card variant={variant === "warning" ? "warning" : "default"}>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
