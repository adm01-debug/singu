// ============================================================================
// SINGU CRM — Dashboard Operacional (vendedor individual)
// Path: src/pages/DashboardOperacional.tsx
// Rota: /dashboard/operacional
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, MessageSquare, TrendingUp, AlertCircle, Calendar } from "lucide-react";

interface WeeklyStats {
  week: string;
  total_interactions: number;
  unique_contacts: number;
  calls: number;
  whatsapp_msgs: number;
  emails: number;
  meetings: number;
  followups_created: number;
  positive_count: number;
  negative_count: number;
  avg_sentiment_score: number;
  outbound_count: number;
  inbound_count: number;
}

interface PipelineFunnel {
  stage: string;
  contact_count: number;
  active_30d: number;
}

interface HealthAlertSummary {
  severity: string;
  open_count: number;
  new_7d: number;
  avg_resolution_hours: number | null;
}

const STAGE_LABELS: Record<string, string> = {
  unknown: "Desconhecido",
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
  customer: "Cliente",
  lost: "Perdido",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "destructive",
  warning: "default",
  info: "secondary",
};

export default function DashboardOperacional() {
  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ["dashboard", "weekly-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_my_weekly_stats")
        .select("*")
        .order("week", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as WeeklyStats[];
    },
  });

  const { data: pipeline, isLoading: loadingPipeline } = useQuery({
    queryKey: ["dashboard", "pipeline-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_my_pipeline_funnel")
        .select("*");
      if (error) throw error;
      return data as PipelineFunnel[];
    },
  });

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["dashboard", "health-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_my_health_alerts_summary")
        .select("*");
      if (error) throw error;
      return data as HealthAlertSummary[];
    },
  });

  const currentWeek = weekly?.[0];
  const previousWeek = weekly?.[1];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seu Painel</h1>
        <p className="text-muted-foreground">Como você está esta semana</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Interações"
          icon={<Activity className="h-5 w-5" />}
          value={currentWeek?.total_interactions ?? 0}
          previousValue={previousWeek?.total_interactions}
          loading={loadingWeekly}
        />
        <KpiCard
          title="Contatos Únicos"
          icon={<Users className="h-5 w-5" />}
          value={currentWeek?.unique_contacts ?? 0}
          previousValue={previousWeek?.unique_contacts}
          loading={loadingWeekly}
        />
        <KpiCard
          title="Mensagens WhatsApp"
          icon={<MessageSquare className="h-5 w-5" />}
          value={currentWeek?.whatsapp_msgs ?? 0}
          previousValue={previousWeek?.whatsapp_msgs}
          loading={loadingWeekly}
        />
        <KpiCard
          title="Sentimento Médio"
          icon={<TrendingUp className="h-5 w-5" />}
          value={currentWeek?.avg_sentiment_score ?? 0}
          previousValue={previousWeek?.avg_sentiment_score}
          loading={loadingWeekly}
          formatter={(v) => v.toFixed(2)}
        />
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seu Pipeline
          </CardTitle>
          <CardDescription>Distribuição de contatos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPipeline ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {["unknown", "cold", "warm", "hot", "customer", "lost"].map((stage) => {
                const item = pipeline?.find((p) => p.stage === stage);
                return (
                  <div
                    key={stage}
                    className="p-4 border rounded-lg text-center bg-card hover:bg-accent transition-colors"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {STAGE_LABELS[stage]}
                    </p>
                    <p className="text-2xl font-bold mt-1">{item?.contact_count ?? 0}</p>
                    {item && item.active_30d > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {item.active_30d} ativos 30d
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertas de Saúde
          </CardTitle>
          <CardDescription>Relacionamentos que precisam de atenção</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <Skeleton className="h-24 w-full" />
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.severity}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={SEVERITY_COLORS[alert.severity] as any}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.open_count} abertos</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {alert.new_7d > 0 && <span>{alert.new_7d} novos (7d) · </span>}
                    {alert.avg_resolution_hours && (
                      <span>~{alert.avg_resolution_hours}h de resolução</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              ✨ Nenhum alerta aberto. Tudo sob controle!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tendência semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Suas últimas 12 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWeekly ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-2">
              {weekly?.slice(0, 12).map((w) => (
                <div
                  key={w.week}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <span className="text-muted-foreground">
                    {new Date(w.week).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <div className="flex gap-4">
                    <span>{w.total_interactions} interações</span>
                    <span>{w.unique_contacts} contatos</span>
                    <span
                      className={
                        w.avg_sentiment_score > 0
                          ? "text-green-600"
                          : w.avg_sentiment_score < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }
                    >
                      {w.avg_sentiment_score > 0 ? "+" : ""}
                      {w.avg_sentiment_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  previousValue?: number;
  loading?: boolean;
  formatter?: (v: number) => string;
}

function KpiCard({ title, icon, value, previousValue, loading, formatter }: KpiCardProps) {
  const change = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : null;
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-3xl font-bold">
              {formatter ? formatter(value) : value.toLocaleString("pt-BR")}
            </div>
            {change !== null && (
              <p
                className={`text-xs mt-1 ${
                  isPositive
                    ? "text-green-600"
                    : isNegative
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {isPositive ? "↑" : isNegative ? "↓" : "→"} {Math.abs(change).toFixed(1)}% vs semana anterior
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
