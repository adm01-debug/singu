import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  severity: string;
  created_at: string;
}

interface TelemetryChartsProps {
  rows: TelemetryRow[];
  timeFilter: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  slow: "hsl(var(--warning))",
  very_slow: "hsl(var(--destructive))",
  error: "hsl(0 72% 51%)",
  normal: "hsl(var(--primary))",
};

const PIE_COLORS = [
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(0 72% 51%)",
  "hsl(var(--muted-foreground))",
];

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  const timelineData = useMemo(() => {
    if (!rows.length) return [];
    const buckets = new Map<string, { label: string; slow: number; very_slow: number; error: number }>();
    
    for (const r of rows) {
      const d = new Date(r.created_at);
      let key: string;
      if (timeFilter === "1h" || timeFilter === "6h") {
        key = `${d.getHours().toString().padStart(2, "0")}:${(Math.floor(d.getMinutes() / 10) * 10).toString().padStart(2, "0")}`;
      } else {
        key = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}h`;
      }
      
      if (!buckets.has(key)) buckets.set(key, { label: key, slow: 0, very_slow: 0, error: 0 });
      const b = buckets.get(key)!;
      if (r.severity === "slow") b.slow++;
      else if (r.severity === "very_slow") b.very_slow++;
      else if (r.severity === "error") b.error++;
    }
    
    return [...buckets.values()].reverse();
  }, [rows, timeFilter]);

  const severityDistribution = useMemo(() => {
    const counts = { very_slow: 0, slow: 0, error: 0, normal: 0 };
    for (const r of rows) {
      if (r.severity in counts) counts[r.severity as keyof typeof counts]++;
      else counts.normal++;
    }
    return [
      { name: "Muito Lenta", value: counts.very_slow },
      { name: "Lenta", value: counts.slow },
      { name: "Erro", value: counts.error },
      { name: "Normal", value: counts.normal },
    ].filter(d => d.value > 0);
  }, [rows]);

  if (!rows.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Alertas ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="very_slow" name="Muito Lenta" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="slow" name="Lenta" stackId="a" fill="hsl(45 93% 47%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="error" name="Erro" stackId="a" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribuição por Severidade
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {severityDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
