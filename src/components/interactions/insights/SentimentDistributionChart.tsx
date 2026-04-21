import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentOverall } from "@/hooks/useConversationIntel";

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

  return (
    <div className="space-y-3">
      <div className="h-56 sentiment-pie-focus">
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
                return (
                  <Cell
                    key={d.key}
                    fill={COLORS[d.key] ?? "hsl(var(--muted))"}
                    fillOpacity={dim ? 0.28 : 1}
                    stroke={isActive ? "hsl(var(--foreground))" : "transparent"}
                    strokeWidth={isActive ? 2.5 : 0}
                    style={{
                      transition: "fill-opacity 200ms ease, stroke-width 200ms ease, transform 200ms ease",
                      transformOrigin: "center",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
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
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, _n, p) => [`${v} (${(p.payload as Slice).pct}%)`, LABELS[(p.payload as Slice).key]]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => {
          const clickable = !!onSelectBucket && d.count > 0;
          const isActive = hasActive && d.key === activeBucket;
          const dim = hasActive && !isActive;
          return (
            <li
              key={d.key}
              className={`flex items-center gap-2 rounded px-1 py-0.5 transition-all ${clickable ? "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : ""} ${isActive ? "bg-muted ring-1 ring-ring/60" : ""} ${dim ? "opacity-50" : ""}`}
              onClick={clickable ? () => handleSelect(d.key) : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(d.key); } } : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-pressed={clickable ? isActive : undefined}
              aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}` : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
              <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{LABELS[d.key]}</span>
              <span className="ml-auto font-medium text-foreground">{d.pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
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

  return (
    <div className="space-y-3">
      <div className="h-56 sentiment-pie-focus">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="key"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              onClick={(e: { key?: string } | undefined) => e?.key && handleSelect(e.key)}
              className={onSelectBucket ? "cursor-pointer" : undefined}
            >
              {filtered.map((d) => {
                const clickable = !!onSelectBucket && d.count > 0;
                return (
                  <Cell
                    key={d.key}
                    fill={COLORS[d.key] ?? "hsl(var(--muted))"}
                    tabIndex={clickable ? 0 : -1}
                    role={clickable ? "button" : undefined}
                    aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}` : undefined}
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
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, _n, p) => [`${v} (${(p.payload as Slice).pct}%)`, LABELS[(p.payload as Slice).key]]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => {
          const clickable = !!onSelectBucket && d.count > 0;
          return (
            <li
              key={d.key}
              className={`flex items-center gap-2 rounded px-1 py-0.5 ${clickable ? "cursor-pointer hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : ""}`}
              onClick={clickable ? () => handleSelect(d.key) : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(d.key); } } : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}` : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
              <span className="text-muted-foreground">{LABELS[d.key]}</span>
              <span className="ml-auto font-medium text-foreground">{d.pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const SentimentDistributionChart = memo(SentimentDistributionChartImpl);
