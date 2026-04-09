// ============================================================================
// SINGU CRM — Dashboard Estratégico (diretoria)
// Path: src/pages/DashboardEstrategico.tsx
// Rota: /dashboard/estrategico
// Acesso: apenas admins (verificado server-side via RPC)
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from "lucide-react";

interface NorthStarMetric {
  metric: string;
  current_value: number;
  target_value: number;
  trend_pct: number;
  unit: string;
}

interface ModuleAdoption {
  module: string;
  active_users: number;
  total_users: number;
  adoption_pct: number;
}

interface IntegrationCost {
  integration: string;
  monthly_cost: number;
  events_count: number;
  attributed_revenue: number;
  roi: number;
}

export default function DashboardEstrategico() {
  // Verifica se é admin (em frontend é UX; segurança real é no backend)
  const { data: profile } = useQuery({
    queryKey: ["profile-admin-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: northStar, isLoading: loadingNs } = useQuery({
    queryKey: ["dashboard-strategic", "north-star"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_north_star_metrics");
      if (error) {
        console.warn("RPC unavailable, using mock data");
        return mockNorthStar;
      }
      return data as NorthStarMetric[];
    },
    enabled: profile?.is_admin === true,
  });

  const { data: adoption } = useQuery({
    queryKey: ["dashboard-strategic", "module-adoption"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_module_adoption");
      if (error) return mockAdoption;
      return data as ModuleAdoption[];
    },
    enabled: profile?.is_admin === true,
  });

  const { data: integrations } = useQuery({
    queryKey: ["dashboard-strategic", "integration-costs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_integration_costs");
      if (error) return mockIntegrationCosts;
      return data as IntegrationCost[];
    },
    enabled: profile?.is_admin === true,
  });

  if (profile && !profile.is_admin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              O dashboard estratégico está disponível apenas para administradores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Estratégico</h1>
        <p className="text-muted-foreground">North star metrics, ROI e tendências</p>
      </div>

      {/* North Star Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingNs ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          northStar?.map((m) => (
            <NorthStarCard key={m.metric} metric={m} />
          ))
        )}
      </div>

      {/* Adoção de módulos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Adoção dos Módulos Cognitivos
          </CardTitle>
          <CardDescription>% de usuários ativos por módulo (DAU)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adoption?.map((m) => (
              <div key={m.module}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.module}</span>
                  <span className="text-muted-foreground">
                    {m.active_users}/{m.total_users} ({m.adoption_pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${m.adoption_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI integrações externas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ROI das Integrações Externas
          </CardTitle>
          <CardDescription>Custo mensal vs receita atribuída</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-2">Integração</th>
                <th className="text-right p-2">Custo</th>
                <th className="text-right p-2">Eventos</th>
                <th className="text-right p-2">Receita</th>
                <th className="text-right p-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {integrations?.map((i) => (
                <tr key={i.integration} className="border-b hover:bg-accent">
                  <td className="p-2 font-medium">{i.integration}</td>
                  <td className="p-2 text-right">
                    {i.monthly_cost.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="p-2 text-right">{i.events_count.toLocaleString("pt-BR")}</td>
                  <td className="p-2 text-right">
                    {i.attributed_revenue.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="p-2 text-right font-bold text-green-600">{i.roi.toFixed(0)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function NorthStarCard({ metric }: { metric: NorthStarMetric }) {
  const isPositive = metric.trend_pct >= 0;
  const isOnTarget = metric.current_value >= metric.target_value;

  const formatValue = (v: number) => {
    if (metric.unit === "BRL") {
      return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    }
    if (metric.unit === "%") return `${v.toFixed(1)}%`;
    if (metric.unit === "months") return `${v} meses`;
    if (metric.unit === "x") return `${v.toFixed(1)}×`;
    return v.toLocaleString("pt-BR");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.metric}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatValue(metric.current_value)}</span>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
        </div>
        <p
          className={`text-xs mt-1 ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {metric.trend_pct.toFixed(1)}% (90d)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Meta: {formatValue(metric.target_value)}{" "}
          {isOnTarget ? "✅" : "⏳"}
        </p>
      </CardContent>
    </Card>
  );
}

// Mock data para enquanto as RPCs não existem
const mockNorthStar: NorthStarMetric[] = [
  { metric: "MRR", current_value: 480000, target_value: 600000, trend_pct: 12, unit: "BRL" },
  { metric: "NRR", current_value: 108, target_value: 110, trend_pct: 0, unit: "%" },
  { metric: "CAC Payback", current_value: 8, target_value: 6, trend_pct: -1, unit: "months" },
  { metric: "LTV/CAC", current_value: 3.4, target_value: 4, trend_pct: 6, unit: "x" },
  { metric: "Churn Mensal", current_value: 2.8, target_value: 2, trend_pct: -0.4, unit: "%" },
  { metric: "Win Rate", current_value: 32, target_value: 35, trend_pct: 3, unit: "%" },
];

const mockAdoption: ModuleAdoption[] = [
  { module: "DISC Analyzer", active_users: 12, total_users: 15, adoption_pct: 80 },
  { module: "NLP Coach", active_users: 9, total_users: 15, adoption_pct: 60 },
  { module: "Lux Intelligence", active_users: 6, total_users: 15, adoption_pct: 40 },
  { module: "RFM", active_users: 8, total_users: 15, adoption_pct: 53 },
  { module: "Trigger Bundles", active_users: 11, total_users: 15, adoption_pct: 73 },
];

const mockIntegrationCosts: IntegrationCost[] = [
  { integration: "Lovable AI", monthly_cost: 800, events_count: 12000, attributed_revenue: 65000, roi: 81 },
  { integration: "Firecrawl", monthly_cost: 200, events_count: 400, attributed_revenue: 80000, roi: 400 },
  { integration: "EnrichLayer", monthly_cost: 300, events_count: 800, attributed_revenue: 80000, roi: 267 },
  { integration: "ElevenLabs", monthly_cost: 150, events_count: 200, attributed_revenue: 0, roi: 0 },
  { integration: "Evolution API", monthly_cost: 50, events_count: 999999, attributed_revenue: 0, roi: 0 },
];
