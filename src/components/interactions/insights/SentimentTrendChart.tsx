import { memo } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";

interface Point {
  week: string;
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  total: number;
}

interface Props {
  data: Point[];
}

function formatWeek(w: string): string {
  const d = new Date(w);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function SentimentTrendChartImpl({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem tendência no período.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="week" tickFormatter={formatWeek} stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(l) => `Semana de ${formatWeek(String(l))}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="positive" name="Positivo" stroke={CHART_COLORS.positive} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="neutral" name="Neutro" stroke={CHART_COLORS.neutral} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="negative" name="Negativo" stroke={CHART_COLORS.negative} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const SentimentTrendChart = memo(SentimentTrendChartImpl);
