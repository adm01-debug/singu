import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";

interface Slice {
  key: string;
  count: number;
  pct: number;
}

interface Props {
  data: Slice[];
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

function SentimentDistributionChartImpl({ data }: Props) {
  const filtered = data.filter((d) => d.count > 0);
  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem dados de sentimento no período.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filtered} dataKey="count" nameKey="key" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {filtered.map((d) => (
                <Cell key={d.key} fill={COLORS[d.key] ?? "hsl(var(--muted))"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, _n, p) => [`${v} (${(p.payload as Slice).pct}%)`, LABELS[(p.payload as Slice).key]]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
            <span className="text-muted-foreground">{LABELS[d.key]}</span>
            <span className="ml-auto font-medium text-foreground">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const SentimentDistributionChart = memo(SentimentDistributionChartImpl);
