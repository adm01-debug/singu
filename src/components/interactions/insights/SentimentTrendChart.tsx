import { memo } from "react";
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
} from "recharts";
import type { TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentTrendPoint, SentimentTrendSummary } from "@/hooks/useInteractionsInsights";
import { cn } from "@/lib/utils";

interface Props {
  data: SentimentTrendPoint[];
  summary?: SentimentTrendSummary;
}

function formatWeek(w: string): string {
  const d = new Date(w);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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

const SENTIMENT_ROWS: Array<{ key: "positive" | "neutral" | "negative" | "mixed"; label: string; color: string }> = [
  { key: "positive", label: "Positivo", color: CHART_COLORS.positive },
  { key: "neutral", label: "Neutro", color: CHART_COLORS.neutral },
  { key: "negative", label: "Negativo", color: CHART_COLORS.negative },
  { key: "mixed", label: "Misto", color: CHART_COLORS.mixed },
];

function pctClass(pct: number): string {
  if (pct >= 60) return "text-success";
  if (pct <= 30) return "text-destructive";
  return "text-muted-foreground";
}

function WeeklySentimentTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as SentimentTrendPoint | undefined;
  if (!point) return null;

  const total = point.total ?? 0;
  const positivePct =
    typeof point.positivePct === "number"
      ? point.positivePct
      : total > 0
        ? Math.round((point.positive / total) * 100)
        : 0;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground min-w-[200px]">
      <p className="font-semibold">Semana de {formatWeek(point.week)}</p>
      {total === 0 ? (
        <p className="text-[10px] text-muted-foreground mt-0.5">sem conversas</p>
      ) : (
        <>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {total} {total === 1 ? "conversa" : "conversas"} ·{" "}
            <span className={cn("font-medium", pctClass(positivePct))}>{positivePct}% positivo</span>
          </p>
          <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
            {SENTIMENT_ROWS.map((row) => {
              const count = point[row.key] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={row.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <span className="flex-1">{row.label}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                  <span className="text-muted-foreground tabular-nums w-10 text-right">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SentimentTrendChartImpl({ data, summary }: Props) {
  if (!Array.isArray(data) || data.length < 2) {
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
      {summary && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="outline" className={cn("gap-1 text-[10px]", DIRECTION_CLASS[summary.direction])}>
            <Icon className="h-3 w-3" />
            {DIRECTION_LABEL[summary.direction]} {deltaSign}
            {summary.deltaPct}pp
          </Badge>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] flex-1 max-w-md">
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
          </div>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tickFormatter={formatWeek} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              yAxisId="count"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
            />
            <Tooltip
              content={<WeeklySentimentTooltip />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {showRefLines && summary?.bestWeek && (
              <ReferenceLine yAxisId="count" x={summary.bestWeek.week} stroke="hsl(var(--success))" strokeDasharray="2 2" />
            )}
            {showRefLines && summary?.worstWeek && (
              <ReferenceLine yAxisId="count" x={summary.worstWeek.week} stroke="hsl(var(--destructive))" strokeDasharray="2 2" />
            )}
            <Bar yAxisId="count" dataKey="total" name="Volume" fill="hsl(var(--muted-foreground))" opacity={0.18} />
            <Line yAxisId="count" type="monotone" dataKey="positive" name="Positivo" stroke={CHART_COLORS.positive} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="neutral" name="Neutro" stroke={CHART_COLORS.neutral} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="negative" name="Negativo" stroke={CHART_COLORS.negative} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="mixed" name="Misto" stroke={CHART_COLORS.mixed} strokeWidth={2} dot={false} />
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const SentimentTrendChart = memo(SentimentTrendChartImpl);
