// ============================================================================
// SINGU CRM — Dashboard Tático (gestor comercial)
// Path: src/pages/DashboardTatico.tsx
// Rota: /dashboard/tatico
// Acesso: gestores e admins
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, TrendingUp, AlertTriangle } from "lucide-react";

interface RfmDist {
  segment: string;
  contact_count: number;
  total_value: number;
  avg_value: number;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  total_interactions: number;
  unique_contacts: number;
  avg_sentiment_score: number;
}

const SEGMENT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  Champions: { label: "Champions", color: "bg-yellow-500", emoji: "🏆" },
  "Loyal Customers": { label: "Loyal", color: "bg-green-500", emoji: "💚" },
  "Potential Loyalists": { label: "Potencial", color: "bg-blue-500", emoji: "🌱" },
  "New Customers": { label: "Novos", color: "bg-cyan-500", emoji: "🆕" },
  "At Risk": { label: "Em Risco", color: "bg-orange-500", emoji: "⚠️" },
  "Cant Lose": { label: "Não Perder", color: "bg-red-600", emoji: "🔴" },
  Hibernating: { label: "Hibernando", color: "bg-gray-400", emoji: "💤" },
  Lost: { label: "Perdidos", color: "bg-gray-700", emoji: "❌" },
};

export default function DashboardTatico() {
  const { data: rfm, isLoading: loadingRfm } = useQuery({
    queryKey: ["dashboard-tactical", "rfm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_my_rfm_distribution")
        .select("*")
        .order("total_value", { ascending: false });
      if (error) throw error;
      return data as RfmDist[];
    },
  });

  const { data: teamRanking, isLoading: loadingTeam } = useQuery({
    queryKey: ["dashboard-tactical", "team-ranking"],
    queryFn: async () => {
      // Requer admin/manager — usa join com profiles
      const { data, error } = await supabase.rpc("get_team_weekly_ranking");
      if (error) {
        console.warn("Team ranking RPC unavailable, falling back to my own stats");
        return [] as TeamMember[];
      }
      return data as TeamMember[];
    },
    retry: false,
  });

  const totalContacts = rfm?.reduce((acc, r) => acc + r.contact_count, 0) ?? 0;
  const totalValue = rfm?.reduce((acc, r) => acc + (r.total_value || 0), 0) ?? 0;
  const championsCount = rfm?.find((r) => r.segment === "Champions")?.contact_count ?? 0;
  const atRiskCount = rfm?.find((r) => r.segment === "At Risk")?.contact_count ?? 0;
  const championsPct = totalContacts > 0 ? (championsCount / totalContacts) * 100 : 0;
  const atRiskPct = totalContacts > 0 ? (atRiskCount / totalContacts) * 100 : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Tático</h1>
        <p className="text-muted-foreground">Visão consolidada de portfólio e time</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRfm ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-bold">{totalContacts.toLocaleString("pt-BR")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRfm ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-3xl font-bold">
                {totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              % Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRfm ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{championsPct.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Meta: ≥15%</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              % Em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRfm ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{atRiskPct.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Meta: ≤10%</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RFM Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição RFM do Portfólio</CardTitle>
          <CardDescription>Segmentação automática por Recência, Frequência e Valor</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRfm ? (
            <Skeleton className="h-40 w-full" />
          ) : rfm && rfm.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {rfm.map((seg) => {
                const meta = SEGMENT_LABELS[seg.segment] || {
                  label: seg.segment,
                  color: "bg-gray-300",
                  emoji: "📊",
                };
                return (
                  <div
                    key={seg.segment}
                    className="p-4 border rounded-lg space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{meta.emoji}</span>
                      <Badge variant="secondary">{seg.contact_count}</Badge>
                    </div>
                    <p className="font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {(seg.total_value || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Sem dados RFM. Rode o rfm-analyzer pra gerar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Ranking do Time (semana atual)
          </CardTitle>
          <CardDescription>Apenas gestores e admins veem todos os vendedores</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTeam ? (
            <Skeleton className="h-40 w-full" />
          ) : teamRanking && teamRanking.length > 0 ? (
            <div className="space-y-2">
              {teamRanking.map((m, idx) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                    </span>
                    <div>
                      <p className="font-medium">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.unique_contacts} contatos únicos
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-bold">{m.total_interactions}</p>
                      <p className="text-xs text-muted-foreground">interações</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          m.avg_sentiment_score > 0 ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {m.avg_sentiment_score > 0 ? "+" : ""}
                        {m.avg_sentiment_score.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">sentimento</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Você não tem permissão para ver o ranking do time, ou ainda não há dados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
