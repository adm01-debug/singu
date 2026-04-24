import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentOverall } from "@/hooks/useConversationIntel";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AFFORDANCE_HINT = "Clique para ver conversas";

interface Slice {
  key: string;
  count: number;
  pct: number;
}

interface Props {
  data: Slice[];
  onSelectBucket?: (key: SentimentOverall) => void;
  activeBucket?: SentimentOverall | null;
}

const COLORS: Record<string, string> = {
  positive: CHART_COLORS.positive,
  neutral: CHART_COLORS.neutral,
  negative: CHART_COLORS.negative,
  mixed: "hsl(262, 83%, 58%)",
};

const LABELS: Record<string, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
  mixed: "Misto",
};

function isSentimentKey(k: string): k is SentimentOverall {
  return k === "positive" || k === "neutral" || k === "negative" || k === "mixed";
}

function SentimentDistributionChartImpl({ data, onSelectBucket, activeBucket }: Props) {
  const filtered = data.filter((d) => d.count > 0);
  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem dados de sentimento no período.</p>;
  }

  const handleSelect = (key: string) => {
    if (!onSelectBucket || !isSentimentKey(key)) return;
    const slice = data.find((d) => d.key === key);
    if (!slice || slice.count === 0) return;
    onSelectBucket(key);
  };

  const hasActive = !!activeBucket && filtered.some((d) => d.key === activeBucket);
  const activeSlice = hasActive ? filtered.find((d) => d.key === activeBucket) : undefined;
  const activeColor = activeSlice ? COLORS[activeSlice.key] ?? "hsl(var(--muted))" : undefined;

  // Pie de "anel" externo: só renderiza arco da fatia ativa, deixando o resto transparente.
  // Reforça visualmente a correspondência entre o bucket aberto na lista e sua fatia.
  const ringData = hasActive
    ? filtered.map((d) => ({ ...d, _ring: d.key === activeBucket ? 1 : 0 }))
    : [];

  return (
    <div className="space-y-3">
      <div className="h-56 sentiment-pie-focus relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="key"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              isAnimationActive={false}
              onClick={(e: { key?: string } | undefined) => e?.key && handleSelect(e.key)}
              className={onSelectBucket ? "cursor-pointer" : undefined}
            >
              {filtered.map((d) => {
                const clickable = !!onSelectBucket && d.count > 0;
                const isActive = hasActive && d.key === activeBucket;
                const dim = hasActive && !isActive;
                const sliceColor = COLORS[d.key] ?? "hsl(var(--muted))";
                return (
                  <Cell
                    key={d.key}
                    fill={sliceColor}
                    fillOpacity={dim ? 0.22 : 1}
                    stroke={isActive ? "hsl(var(--background))" : "transparent"}
                    strokeWidth={isActive ? 2 : 0}
                    style={{
                      transition: "fill-opacity 200ms ease, stroke-width 200ms ease, transform 200ms ease, filter 200ms ease",
                      transformOrigin: "center",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      filter: isActive ? `drop-shadow(0 0 6px ${sliceColor})` : "none",
                    }}
                    tabIndex={clickable ? 0 : -1}
                    role={clickable ? "button" : undefined}
                    aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}` : undefined}
                    aria-pressed={clickable ? isActive : undefined}
                    onKeyDown={clickable ? (e: React.KeyboardEvent<SVGPathElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(d.key);
                      }
                    } : undefined}
                  />
                );
              })}
            </Pie>
            {hasActive && (
              <Pie
                data={ringData}
                dataKey="count"
                nameKey="key"
                innerRadius={84}
                outerRadius={90}
                paddingAngle={2}
                isAnimationActive={false}
                stroke="none"
              >
                {ringData.map((d) => (
                  <Cell
                    key={`ring-${d.key}`}
                    fill={d._ring ? (COLORS[d.key] ?? "hsl(var(--muted))") : "transparent"}
                    fillOpacity={d._ring ? 0.9 : 0}
                  />
                ))}
              </Pie>
            )}
            <Tooltip
              cursor={false}
              content={(tp: TooltipProps<number, string>) => {
                const item = tp.payload?.[0];
                if (!item) return null;
                const slice = item.payload as Slice;
                const clickable = !!onSelectBucket && slice.count > 0;
                return (
                  <div
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "6px 8px",
                      boxShadow: "0 4px 12px hsl(var(--background) / 0.4)",
                    }}
                  >
                    <div className="font-medium text-foreground">{LABELS[slice.key]}</div>
                    <div className="text-muted-foreground">{slice.count} ({slice.pct}%)</div>
                    {clickable && (
                      <div className="mt-1 text-[10px] text-primary">{AFFORDANCE_HINT}</div>
                    )}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {hasActive && activeSlice && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            aria-hidden="true"
          >
            <span
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: activeColor }}
            >
              {LABELS[activeSlice.key]}
            </span>
            <span className="text-lg font-semibold leading-none text-foreground">
              {activeSlice.pct}%
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {activeSlice.count} {activeSlice.count === 1 ? "conversa" : "conversas"}
            </span>
          </div>
        )}
      </div>
      <TooltipProvider delayDuration={250}>
        <ul className="grid grid-cols-2 gap-2 text-xs">
          {data.map((d) => {
            const clickable = !!onSelectBucket && d.count > 0;
            const isActive = hasActive && d.key === activeBucket;
            const dim = hasActive && !isActive;
            const sliceColor = COLORS[d.key] ?? "hsl(var(--muted))";
            const item = (
              <li
                key={d.key}
                className={`relative flex items-center gap-2 rounded pl-2 pr-1 py-0.5 transition-all border-l-2 ${clickable ? "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : ""} ${isActive ? "bg-muted ring-1 ring-ring/60 shadow-sm" : ""} ${dim ? "opacity-50" : ""}`}
                style={{ borderLeftColor: isActive ? sliceColor : "transparent" }}
                onClick={clickable ? () => handleSelect(d.key) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(d.key); } } : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-pressed={clickable ? isActive : undefined}
                aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}${isActive ? " (selecionado)" : ""}` : undefined}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: sliceColor }} />
                <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{LABELS[d.key]}</span>
                {isActive && (
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: sliceColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="ml-auto font-medium text-foreground">{d.pct}%</span>
              </li>
            );
            if (!clickable) return item;
            return (
              <UITooltip key={d.key}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {AFFORDANCE_HINT}
                </TooltipContent>
              </UITooltip>
            );
          })}
        </ul>
      </TooltipProvider>
    </div>
  );
}

export const SentimentDistributionChart = memo(SentimentDistributionChartImpl);
