import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus, Pin, ShieldCheck, Shield, ShieldAlert, HelpCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentTrendPoint, SentimentTrendSummary } from "@/hooks/useInteractionsInsights";
import { useSentimentAnnotations, type SentimentAnnotation } from "@/hooks/useSentimentAnnotations";
import { ANNOTATION_CATEGORIES } from "./annotationCategories";
import { AnnotationDialog } from "./AnnotationDialog";
import { AnnotationList } from "./AnnotationList";
import { cn } from "@/lib/utils";

interface Props {
  data: SentimentTrendPoint[];
  summary?: SentimentTrendSummary;
  contactId?: string;
}

function formatWeek(w: string): string {
  const d = new Date(w);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatWeekRange(weekStartIso: string): string {
  const iso = normalizeWeek(weekStartIso);
  const start = new Date(iso);
  if (isNaN(start.getTime())) return formatWeek(weekStartIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${fmt(start)} – ${fmt(end)}`;
}

function normalizeWeek(w: string): string {
  // Canonicaliza para 'YYYY-MM-DD' independente do formato de entrada
  if (typeof w !== "string" || w.length === 0) return w;
  return w.length >= 10 ? w.slice(0, 10) : w;
}

function toIsoDate(w: string): string {
  return normalizeWeek(w);
}

const DIRECTION_LABEL: Record<SentimentTrendSummary["direction"], string> = {
  up: "Melhorando",
  stable: "Estável",
  down: "Piorando",
};

const DIRECTION_CLASS: Record<SentimentTrendSummary["direction"], string> = {
  up: "text-success bg-success/10 border-success/30",
  stable: "text-muted-foreground bg-muted border-border",
  down: "text-destructive bg-destructive/10 border-destructive/30",
};

const DIRECTION_ICON = { up: TrendingUp, stable: Minus, down: TrendingDown } as const;

type SentimentKey = "positive" | "neutral" | "negative" | "mixed";

const SENTIMENT_TOKENS: Record<SentimentKey, { label: string; swatch: string; text: string; bar: string }> = {
  positive: { label: "Positivo", swatch: "bg-success", text: "text-success", bar: "bg-success/70" },
  neutral: { label: "Neutro", swatch: "bg-muted-foreground", text: "text-muted-foreground", bar: "bg-muted-foreground/70" },
  negative: { label: "Negativo", swatch: "bg-destructive", text: "text-destructive", bar: "bg-destructive/70" },
  mixed: { label: "Misto", swatch: "bg-warning", text: "text-warning", bar: "bg-warning/70" },
};

const SENTIMENT_ORDER: SentimentKey[] = ["positive", "neutral", "negative", "mixed"];

function pctClass(pct: number): string {
  if (pct >= 60) return "text-success";
  if (pct <= 30) return "text-destructive";
  return "text-muted-foreground";
}

interface TooltipExtra { positivePctMA?: number | null; maWindow?: number; smoothActive?: boolean; annotations?: SentimentAnnotation[] }

const SHOW_ALL_ROWS_KEY = "singu:sentiment-trend:tooltip-show-all-rows";

function readShowAllRows(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SHOW_ALL_ROWS_KEY) === "1";
}

function WeeklySentimentTooltip({ active, payload }: TooltipProps<number, string>) {
  const [showAllRows, setShowAllRows] = useState<boolean>(() => readShowAllRows());

  const toggleShowAll = (next: boolean) => {
    setShowAllRows(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHOW_ALL_ROWS_KEY, next ? "1" : "0");
    }
  };

  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as (SentimentTrendPoint & TooltipExtra) | undefined;
  if (!point) return null;

  const total = point.total ?? 0;
  const positivePct =
    typeof point.positivePct === "number"
      ? point.positivePct
      : total > 0
        ? Math.round((point.positive / total) * 100)
        : 0;
  const anns = point.annotations ?? [];
  

  const visibleKeys = showAllRows
    ? SENTIMENT_ORDER
    : SENTIMENT_ORDER.filter((k) => (point[k] ?? 0) > 0);

  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-sm p-3 min-w-[220px] max-w-[280px] pointer-events-auto space-y-2">
      <div className="space-y-0.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Semana de {formatWeekRange(point.week)}
        </p>
        {total === 0 ? (
          <p className="text-xs text-muted-foreground">Volume: 0 interações</p>
        ) : (
          <p className="text-xs font-semibold text-foreground">
            Volume: <span className="tabular-nums">{total}</span> {total === 1 ? "interação" : "interações"}
          </p>
        )}
      </div>

      {total > 0 && (
        <>
          <div className="text-xs border-t border-border/60 pt-2">
            <span className={cn("font-semibold tabular-nums", pctClass(positivePct))}>{positivePct}%</span>
            <span className="ml-1 text-muted-foreground">positivo</span>
            {typeof point.positivePctMA === "number" && (
              <span className="ml-2 text-muted-foreground">
                · MM{point.maWindow ?? 3}: <span className="font-medium tabular-nums">{point.positivePctMA}%</span>
              </span>
            )}
          </div>

          <div className="border-t border-border/60 pt-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="tooltip-show-all-rows" className="text-[10px] text-muted-foreground cursor-pointer">
                Mostrar zerados
              </Label>
              <Switch
                id="tooltip-show-all-rows"
                checked={showAllRows}
                onCheckedChange={toggleShowAll}
                aria-label="Alternar exibição de sentimentos com contagem zero"
                className="scale-75 origin-right"
              />
            </div>
            {visibleKeys.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">Nenhum sentimento registrado.</p>
            ) : (
              <ul className="space-y-1">
                {visibleKeys.map((k) => {
                  const tokens = SENTIMENT_TOKENS[k];
                  const count = point[k] ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isZero = count === 0;
                  const isMixed = k === "mixed";
                  return (
                    <li
                      key={k}
                      className={cn(
                        "space-y-0.5",
                        isZero && "opacity-50",
                        isMixed && !isZero && "rounded-sm bg-warning/10 px-1.5 py-1 -mx-1.5 ring-1 ring-warning/30 opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("h-2 w-2 rounded-sm shrink-0", tokens.swatch)} aria-hidden />
                        <span className={cn("flex-1 truncate text-foreground", isMixed && !isZero && "font-semibold")}>
                          {tokens.label}
                          {isMixed && !isZero && (
                            <span className="ml-1 text-[9px] uppercase tracking-wide text-warning font-semibold">destaque</span>
                          )}
                        </span>
                        <span className="tabular-nums font-medium text-foreground min-w-[1.5rem] text-right">{count}</span>
                        <span className="tabular-nums text-muted-foreground text-[10px] min-w-[2.5rem] text-right">{pct}%</span>
                      </div>
                      <div className="h-0.5 w-full rounded-full bg-muted/60 overflow-hidden ml-4">
                        <div
                          className={cn("h-full rounded-full transition-all", tokens.bar)}
                          style={{ width: `${pct}%` }}
                          aria-hidden
                        />
                      </div>
                      {isMixed && isZero && (
                        <p className="text-[10px] text-muted-foreground italic ml-4">
                          Sem conversas mistas nesta semana.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {!showAllRows && (point.mixed ?? 0) === 0 && total > 0 && (
              <p className="text-[10px] text-warning/90 italic">
                Misto: 0 nesta semana — sem sinais ambíguos.
              </p>
            )}
          </div>
        </>
      )}

      {anns.length > 0 && (
        <div className="border-t border-border/60 pt-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground">Anotações</p>
          {anns.slice(0, 2).map((a) => {
            const meta = ANNOTATION_CATEGORIES[a.category];
            return (
              <p key={a.id} className="text-[10px] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} aria-hidden />
                <span className="font-medium truncate text-foreground">{a.title}</span>
              </p>
            );
          })}
          {anns.length > 2 && (
            <p className="text-[10px] text-muted-foreground">+{anns.length - 2} mais</p>
          )}
        </div>
      )}
    </div>
  );
}

type EvolutionDirection = "up" | "stable" | "down";
interface EvolutionStats {
  currentPct: number;
  previousPct: number;
  deltaPp: number;
  direction: EvolutionDirection;
  weeksCompared: number;
}

const SHOW_PCT_LINE_KEY = "singu:sentiment-trend:show-pct-line";
const SMOOTH_ENABLED_KEY = "singu:sentiment-trend:smooth-enabled";
const SMOOTH_WINDOW_KEY = "singu:sentiment-trend:smooth-window";
type SmoothWindow = 2 | 3;
function readSmoothWindow(): SmoothWindow {
  if (typeof window === "undefined") return 3;
  const v = window.localStorage.getItem(SMOOTH_WINDOW_KEY);
  return v === "2" ? 2 : 3;
}

function SentimentTrendChartImpl({ data, summary, contactId }: Props) {
  const [smoothEnabled, setSmoothEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(SMOOTH_ENABLED_KEY);
    return v === null ? true : v === "1";
  });
  const toggleSmooth = (next: boolean) => {
    setSmoothEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SMOOTH_ENABLED_KEY, next ? "1" : "0");
    }
  };
  const [smoothWindow, setSmoothWindow] = useState<SmoothWindow>(() => readSmoothWindow());
  const changeSmoothWindow = (next: SmoothWindow) => {
    setSmoothWindow(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SMOOTH_WINDOW_KEY, String(next));
    }
  };
  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<SentimentAnnotation | null>(null);
  const [showPositivePctLine, setShowPositivePctLine] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(SHOW_PCT_LINE_KEY);
    return v === null ? true : v === "1";
  });
  const togglePctLine = (next: boolean) => {
    setShowPositivePctLine(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHOW_PCT_LINE_KEY, next ? "1" : "0");
    }
  };

  const annotationsApi = useSentimentAnnotations(contactId);
  const annotationsByWeek = annotationsApi.byWeek;

  const sortedData = useMemo(() => {
    const safe = Array.isArray(data) ? data : [];
    const normalized = safe.map((p) => ({ ...p, week: normalizeWeek(p.week) }));
    // Dedup defensivo por semana (mantém primeira ocorrência)
    const seen = new Set<string>();
    const unique: SentimentTrendPoint[] = [];
    for (const p of normalized) {
      if (seen.has(p.week)) continue;
      seen.add(p.week);
      unique.push(p);
    }
    // Ordena cronologicamente por timestamp real (não lexicográfico)
    unique.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
    return unique;
  }, [data]);

  const dataWithMA = useMemo(() => {
    return sortedData.map((p, i) => {
      const start = Math.max(0, i - (smoothWindow - 1));
      const window = sortedData.slice(start, i + 1);
      const sumPos = window.reduce((a, w) => a + (w.positive ?? 0), 0);
      const sumTot = window.reduce((a, w) => a + (w.total ?? 0), 0);
      const positivePctMA = sumTot > 0 ? Math.round((sumPos / sumTot) * 100) : null;
      const annotations = annotationsByWeek.get(p.week) ?? [];
      return { ...p, positivePctMA, maWindow: smoothWindow, annotations };
    });
  }, [sortedData, annotationsByWeek, smoothWindow]);

  const weekOptions = useMemo(() => sortedData.map((p) => p.week), [sortedData]);

  const annotationDots = useMemo(() => {
    return dataWithMA
      .filter((p) => (p.annotations?.length ?? 0) > 0)
      .map((p) => {
        const first = p.annotations![0];
        const meta = ANNOTATION_CATEGORIES[first.category];
        return { week: p.week, color: meta.color, count: p.annotations!.length };
      });
  }, [dataWithMA]);

  const mixedStats = useMemo(() => {
    const totalMixed = sortedData.reduce((acc, p) => acc + (p.mixed ?? 0), 0);
    const totalAll = sortedData.reduce((acc, p) => acc + (p.total ?? 0), 0);
    const pct = totalAll > 0 ? Math.round((totalMixed / totalAll) * 100) : 0;
    return { totalMixed, pct };
  }, [sortedData]);

  const evolutionStats = useMemo<EvolutionStats | null>(() => {
    if (sortedData.length < 4) return null;
    const mid = Math.floor(sortedData.length / 2);
    const prev = sortedData.slice(0, mid);
    const curr = sortedData.slice(mid);
    const sumPos = (arr: SentimentTrendPoint[]) => arr.reduce((a, p) => a + (p.positive ?? 0), 0);
    const sumTot = (arr: SentimentTrendPoint[]) => arr.reduce((a, p) => a + (p.total ?? 0), 0);
    const prevTot = sumTot(prev);
    const currTot = sumTot(curr);
    if (prevTot === 0 || currTot === 0) return null;
    const previousPct = Math.round((sumPos(prev) / prevTot) * 100);
    const currentPct = Math.round((sumPos(curr) / currTot) * 100);
    const deltaPp = currentPct - previousPct;
    const direction: EvolutionDirection = Math.abs(deltaPp) < 3 ? "stable" : deltaPp > 0 ? "up" : "down";
    return { currentPct, previousPct, deltaPp, direction, weeksCompared: prev.length };
  }, [sortedData]);

  const confidenceInfo = useMemo(() => {
    if (!evolutionStats || sortedData.length < 4) return null;
    const pcts = sortedData.map((p) => {
      const tot = p.total ?? 0;
      if (tot <= 0) return null;
      return typeof p.positivePct === "number" ? p.positivePct : Math.round(((p.positive ?? 0) / tot) * 100);
    }).filter((v): v is number => v !== null);
    if (pcts.length < 4) return null;
    const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const variance = pcts.reduce((a, b) => a + (b - mean) ** 2, 0) / pcts.length;
    const stdDev = Math.sqrt(variance);
    const marginPp = stdDev / Math.sqrt(pcts.length);
    const absDelta = Math.abs(evolutionStats.deltaPp);
    const level: "high" | "medium" | "low" =
      absDelta >= 2 * marginPp ? "high" : absDelta < marginPp ? "low" : "medium";
    const marginStr = marginPp.toFixed(1);
    const meta = {
      high: { label: `Variação significativa (±${marginStr}pp de margem)`, icon: ShieldCheck, colorClass: "text-success" },
      medium: { label: `Variação moderada (±${marginStr}pp de margem)`, icon: Shield, colorClass: "text-muted-foreground" },
      low: { label: `Dentro do ruído típico (±${marginStr}pp de margem) — leitura pouco confiável`, icon: ShieldAlert, colorClass: "text-warning" },
    } as const;
    return { level, marginPp, stdDev, n: pcts.length, ...meta[level] };
  }, [sortedData, evolutionStats]);


  if (sortedData.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Dados insuficientes para tendência (mín. 2 semanas).
      </p>
    );
  }

  const Icon = summary ? DIRECTION_ICON[summary.direction] : Minus;
  const deltaSign = summary && summary.deltaPct > 0 ? "+" : "";
  const showRefLines =
    summary?.bestWeek && summary?.worstWeek && summary.bestWeek.week !== summary.worstWeek.week;

  return (
    <div className="space-y-3">
      {evolutionStats ? (() => {
        const EvIcon = DIRECTION_ICON[evolutionStats.direction];
        const evLabel = evolutionStats.direction === "up" ? "Subiu" : evolutionStats.direction === "down" ? "Desceu" : "Estável";
        const evSign = evolutionStats.deltaPp > 0 ? "+" : evolutionStats.deltaPp < 0 ? "−" : "";
        const CIcon = confidenceInfo?.icon;
        return (
          <div className={cn("rounded-md border px-3 py-2 space-y-1", DIRECTION_CLASS[evolutionStats.direction])}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <EvIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">% positivo {evLabel.toLowerCase()}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Período atual: {evolutionStats.currentPct}% · Período anterior: {evolutionStats.previousPct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("gap-1 text-[10px] tabular-nums", DIRECTION_CLASS[evolutionStats.direction])}>{evSign}{Math.abs(evolutionStats.deltaPp)}pp</Badge>
                <span className="text-[10px] text-muted-foreground">vs. {evolutionStats.weeksCompared} semanas anteriores</span>
              </div>
            </div>
            {confidenceInfo && CIcon && (
              <TooltipProvider delayDuration={150}>
                <div className={cn("flex items-center gap-1.5 text-[11px]", confidenceInfo.colorClass)}>
                  <CIcon className="h-3 w-3 shrink-0" />
                  <span>{confidenceInfo.label}</span>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                        aria-label="Como calculo o intervalo de confiança"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-[11px] leading-relaxed">
                      <p className="font-semibold mb-1">Como calculo essa margem</p>
                      <p className="text-muted-foreground">
                        Calculo o desvio-padrão semanal do % positivo nas {confidenceInfo.n} semanas do período
                        (σ ≈ {confidenceInfo.stdDev.toFixed(1)}pp) e divido por √n para obter a margem
                        (±{confidenceInfo.marginPp.toFixed(1)}pp). Se o delta atual for ≥ 2× a margem, a variação é
                        <span className="text-success"> significativa</span>; abaixo da margem, está
                        <span className="text-warning"> dentro do ruído</span>.
                      </p>
                      <p className="text-muted-foreground mt-1.5 italic">
                        Heurística aproximada — não substitui um teste estatístico formal.
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </TooltipProvider>
            )}
          </div>
        );
      })() : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Minus className="h-3.5 w-3.5 shrink-0" />
          <span>
            Comparação de períodos indisponível — são necessárias ao menos 4 semanas com volume em cada metade.
          </span>
        </div>
      )}
      {summary && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1 text-[10px]", DIRECTION_CLASS[summary.direction])}>
              <Icon className="h-3 w-3" />
              {DIRECTION_LABEL[summary.direction]} {deltaSign}
              {summary.deltaPct}pp
            </Badge>
            <Button
              type="button"
              variant={smoothEnabled ? "secondary" : "outline"}
              size="xs"
              onClick={() => toggleSmooth(!smoothEnabled)}
              aria-pressed={smoothEnabled}
              title={smoothEnabled ? `Desativar média móvel de ${smoothWindow} semanas` : `Ativar média móvel de ${smoothWindow} semanas`}
              className="gap-1"
            >
              <Activity className="h-3 w-3" />
              Média móvel: {smoothEnabled ? `ON (MM${smoothWindow})` : "OFF"}
            </Button>
            {smoothEnabled && (
              <div
                role="radiogroup"
                aria-label="Janela da média móvel"
                className="inline-flex items-center rounded-md border border-border bg-background overflow-hidden"
              >
                {([2, 3] as const).map((w) => {
                  const active = smoothWindow === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => changeSmoothWindow(w)}
                      title={`Janela de ${w} semanas`}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium tabular-nums transition-colors",
                        active
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      MM{w}
                    </button>
                  );
                })}
              </div>
            )}
            {contactId && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => { setEditingAnn(null); setAnnDialogOpen(true); }}
                title="Adicionar anotação"
              >
                <Pin className="h-3 w-3" /> Anotar
              </Button>
            )}
            <div className="flex items-center gap-2 pl-1">
              <Switch
                id="toggle-pct-line"
                checked={showPositivePctLine}
                onCheckedChange={togglePctLine}
                aria-label="Alternar linha de % positivo"
              />
              <Label htmlFor="toggle-pct-line" className="text-xs cursor-pointer">
                Linha % positivo
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] flex-1 max-w-xl">
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-success">
                {summary.bestWeek ? `${formatWeek(summary.bestWeek.week)} · ${summary.bestWeek.positivePct}%` : "—"}
              </p>
              <p className="text-muted-foreground">Melhor</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-destructive">
                {summary.worstWeek ? `${formatWeek(summary.worstWeek.week)} · ${summary.worstWeek.positivePct}%` : "—"}
              </p>
              <p className="text-muted-foreground">Pior</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-foreground">{summary.totalInteractions}</p>
              <p className="text-muted-foreground">Conversas</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-warning tabular-nums">
                {mixedStats.totalMixed} <span className="text-muted-foreground font-normal">· {mixedStats.pct}%</span>
              </p>
              <p className="text-muted-foreground">Mistos</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWithMA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tickFormatter={formatWeek} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis yAxisId="count" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} hide={!showPositivePctLine} />
            <YAxis yAxisId="volume" orientation="right" domain={[0, "dataMax"]} hide />
            <Tooltip content={<WeeklySentimentTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => {
                if (value === "Misto") {
                  if (mixedStats.totalMixed === 0) {
                    return (
                      <span className="text-muted-foreground italic">
                        Misto <span className="text-[10px]">(0 no período)</span>
                      </span>
                    );
                  }
                  return (
                    <span className="text-warning font-semibold">
                      Misto{" "}
                      <span className="text-[10px] text-warning/80 font-normal tabular-nums">
                        ({mixedStats.totalMixed} · {mixedStats.pct}%)
                      </span>
                    </span>
                  );
                }
                return <span className="text-foreground">{value}</span>;
              }}
            />
            {showRefLines && summary?.bestWeek && (
              <ReferenceLine
                yAxisId="pct"
                x={normalizeWeek(summary.bestWeek.week)}
                stroke="hsl(var(--success))"
                strokeDasharray="2 2"
                ifOverflow="extendDomain"
                label={{ value: "Melhor", position: "top", fill: "hsl(var(--success))", fontSize: 10 }}
              />
            )}
            {showRefLines && summary?.worstWeek && (
              <ReferenceLine
                yAxisId="pct"
                x={normalizeWeek(summary.worstWeek.week)}
                stroke="hsl(var(--destructive))"
                strokeDasharray="2 2"
                ifOverflow="extendDomain"
                label={{ value: "Pior", position: "top", fill: "hsl(var(--destructive))", fontSize: 10 }}
              />
            )}
            <Bar yAxisId="volume" dataKey="total" name="Volume" fill="hsl(var(--muted-foreground))" fillOpacity={0.18} radius={[2, 2, 0, 0]} barSize={18} />
            {smoothEnabled && showPositivePctLine && (
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="positivePctMA"
                name={`Tendência (MM${smoothWindow})`}
                stroke="hsl(var(--success))"
                strokeWidth={3}
                strokeOpacity={0.45}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
            <Line yAxisId="count" type="monotone" dataKey="positive" name="Positivo" stroke={CHART_COLORS.positive} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="neutral" name="Neutro" stroke={CHART_COLORS.neutral} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="negative" name="Negativo" stroke={CHART_COLORS.negative} strokeWidth={2} dot={false} />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="mixed"
              name="Misto"
              stroke={CHART_COLORS.mixed}
              strokeWidth={3.5}
              dot={{ r: 3, fill: CHART_COLORS.mixed, stroke: CHART_COLORS.mixed, strokeWidth: 1 }}
              activeDot={{ r: 5, fill: CHART_COLORS.mixed, stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
            {showPositivePctLine && (
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="positivePct"
                name="% Positivo"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {annotationDots.map((d) => (
              <ReferenceDot
                key={d.week}
                yAxisId="pct"
                x={d.week}
                y={100}
                r={5}
                fill={d.color}
                stroke="hsl(var(--background))"
                strokeWidth={1.5}
                ifOverflow="visible"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {contactId && (
        <>
          <AnnotationList api={annotationsApi} onEdit={(a) => { setEditingAnn(a); setAnnDialogOpen(true); }} />
          <AnnotationDialog
            open={annDialogOpen}
            onOpenChange={setAnnDialogOpen}
            contactId={contactId}
            weekOptions={weekOptions}
            editing={editingAnn}
            api={annotationsApi}
          />
        </>
      )}
    </div>
  );
}

export const SentimentTrendChart = memo(SentimentTrendChartImpl);
