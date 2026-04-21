import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, User, FlaskConical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFicha360 } from '@/hooks/useFicha360';
import { useFicha360Filters } from '@/hooks/useFicha360Filters';
import { PerfilComportamentalCard } from '@/components/ficha-360/PerfilComportamentalCard';
import { TagsInteresseCard } from '@/components/ficha-360/TagsInteresseCard';
import { HistoricoTagsCard } from '@/components/ficha-360/HistoricoTagsCard';
import { DadosPessoaisCard } from '@/components/ficha-360/DadosPessoaisCard';
import { FrequenciaContatoCard } from '@/components/ficha-360/FrequenciaContatoCard';
import { UltimasInteracoesCard } from '@/components/ficha-360/UltimasInteracoesCard';
import { ConversasRelacionadasCard } from '@/components/ficha-360/ConversasRelacionadasCard';
import { FiltrosInteracoesBar } from '@/components/ficha-360/FiltrosInteracoesBar';
import { FiltrosAtivosChips } from '@/components/ficha-360/FiltrosAtivosChips';
import { ScoreProntidaoCard } from '@/components/ficha-360/ScoreProntidaoCard';
import { ProximaAcaoCTA } from '@/components/ficha-360/ProximaAcaoCTA';
import { ProximosPassosCard } from '@/components/ficha-360/ProximosPassosCard';
import { ProntidaoTrendChart } from '@/components/ficha-360/ProntidaoTrendChart';
import { SimulationModePanel } from '@/components/ficha-360/SimulationModePanel';
import { computeProntidaoScore } from '@/lib/prontidaoScore';
import { computeProntidaoTrend } from '@/lib/prontidaoTrend';
import { computeProximosPassos } from '@/lib/proximosPassos';
import { applySimulation } from '@/lib/prontidaoSimulation';
import { useProntidaoWeightsStore } from '@/stores/useProntidaoWeightsStore';
import { useSimulationStore } from '@/stores/useSimulationStore';
import { useBestContactTime } from '@/hooks/useBestContactTime';
import { useMemo } from 'react';

const sentimentClass = (s?: string | null) => {
  const v = (s || '').toLowerCase();
  if (v.includes('pos')) return 'bg-success/15 text-success border-success/30';
  if (v.includes('neg')) return 'bg-destructive/15 text-destructive border-destructive/30';
  return 'bg-muted text-muted-foreground border-border';
};

const Ficha360Skeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
    <Skeleton className="h-32 w-full" />
  </div>
);

const Ficha360 = () => {
  const { id } = useParams<{ id: string }>();
  const { days, channels, setDays, setChannels, clear, activeCount } = useFicha360Filters();
  const {
    profile,
    intelligence,
    recentInteractions,
    rapportIntel,
    rapportPoints,
    channelCounts,
    isLoading,
  } = useFicha360(id, { days, channels, interactionsLimit: 50 });

  const weights = useProntidaoWeightsStore((s) => s.weights);
  const simEnabled = useSimulationStore((s) => s.enabled);
  const simOverrides = useSimulationStore((s) => s.overrides);
  // Reaproveita cache do ProximaAcaoCTA — zero query nova
  const { data: bestTime } = useBestContactTime(id ?? '', !!id);

  // Score real (sem simulação) — sempre calculado para comparativo no painel
  const realProntidao = useMemo(
    () => computeProntidaoScore({ profile, intelligence, weights }),
    [profile, intelligence, weights],
  );

  // Profile/intel "efetivos" (com simulação aplicada quando ligada)
  const { profile: effectiveProfile, intelligence: effectiveIntel } = useMemo(() => {
    if (!simEnabled) return { profile, intelligence };
    return applySimulation(profile, intelligence, simOverrides);
  }, [simEnabled, simOverrides, profile, intelligence]);

  const prontidao = useMemo(
    () =>
      computeProntidaoScore({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
      }),
    [effectiveProfile, effectiveIntel, weights],
  );

  const trend = useMemo(
    () =>
      computeProntidaoTrend({
        interactions: recentInteractions,
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
        weeks: 8,
      }),
    [recentInteractions, effectiveProfile, effectiveIntel, weights],
  );

  const { data: passoFeedbacks = [] } = useProximoPassoFeedbacks(id);

  const feedbackHints = useMemo(() => {
    const seen = new Set<string>();
    const hints: { passoId: string; lastOutcome: 'respondeu_positivo' | 'respondeu_neutro' | 'nao_respondeu' | 'nao_atendeu' | 'pulou'; daysAgo: number }[] = [];
    for (const f of passoFeedbacks) {
      if (seen.has(f.passo_id)) continue;
      seen.add(f.passo_id);
      const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(f.executed_at).getTime()) / 86400000));
      hints.push({ passoId: f.passo_id, lastOutcome: f.outcome, daysAgo });
    }
    return hints;
  }, [passoFeedbacks]);

  const passos = useMemo(
    () =>
      computeProximosPassos({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        recentInteractions,
        prontidao,
        birthday: rapportIntel?.birthday ?? null,
        email:
          typeof effectiveIntel?.email === 'string' ? (effectiveIntel.email as string) : null,
        feedbackHints,
      }),
    [effectiveProfile, effectiveIntel, recentInteractions, prontidao, rapportIntel, feedbackHints],
  );

  if (!id) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ID do contato inválido.</p>
          <Button asChild variant="link">
            <Link to="/contatos">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar para contatos
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const fullName = profile?.full_name?.trim() || 'Contato';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AppLayout>
      <SEOHead
        title={`Ficha 360 — ${fullName}`}
        description={`Visão consolidada de ${fullName}: perfil, interesses, frequência de contato e conversas relacionadas.`}
      />
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader
          backTo="/contatos"
          backLabel="Contatos"
          title="Ficha 360"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to={`/contatos/${id}`}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Detalhe completo
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <Ficha360Skeleton />
        ) : (
          <>
            {/* Painel de simulação (sandbox) */}
            <SimulationModePanel
              realScore={realProntidao.score}
              simulatedScore={prontidao.score}
            />

            {/* Banner de aviso quando simulação ativa */}
            {simEnabled && (
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning flex items-center gap-2">
                <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Modo de testes ativo — score, breakdown, tendência e próximos passos refletem
                  cenário simulado, não os dados reais. A próxima ação sugerida pela IA continua
                  usando dados reais do CRM.
                </span>
              </div>
            )}

            {/* Header sticky */}
            <Card className="sticky top-0 z-10">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={undefined} alt={fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {initials || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                      {fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.cargo ? `${profile.cargo}` : 'Cargo não informado'}
                      {profile?.company_name ? ` · ${profile.company_name}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="default" className="text-xs">
                        Score: {profile?.relationship_score ?? '—'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        Estágio: {profile?.relationship_stage ?? '—'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize', sentimentClass(profile?.sentiment))}
                      >
                        {profile?.sentiment ?? 'Sentimento —'}
                      </Badge>
                      {profile?.company_id && (
                        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Link to={`/empresas/${profile.company_id}`}>Ver empresa</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score de Prontidão */}
            <ScoreProntidaoCard data={prontidao} contactId={id} simulated={simEnabled} />

            {/* Próxima ação sugerida (IA + melhor horário + registrar interação) — usa contato real */}
            {id && <ProximaAcaoCTA contactId={id} contactName={fullName} />}

            {/* Tendência semanal do Score de Prontidão */}
            <ProntidaoTrendChart
              data={trend}
              currentScore={prontidao.score}
              simulated={simEnabled}
            />

            {/* Grid 2 colunas */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <PerfilComportamentalCard profile={profile} />
                <TagsInteresseCard rapportIntel={rapportIntel} rapportPoints={rapportPoints} />
                <HistoricoTagsCard contactId={id} />
                <DadosPessoaisCard rapportIntel={rapportIntel} />
              </div>
              <div className="space-y-4">
                <FrequenciaContatoCard profile={profile} intelligence={intelligence} />
                <ProximosPassosCard
                  contactId={id}
                  contactName={fullName}
                  passos={passos}
                  bestTime={bestTime}
                  firstName={effectiveProfile?.first_name ?? fullName.split(' ')[0]}
                  sentiment={(effectiveProfile?.sentiment ?? null) as 'positivo' | 'neutro' | 'negativo' | 'misto' | null}
                />
                <UltimasInteracoesCard
                  interactions={recentInteractions}
                  contactId={id}
                  filtersActive={activeCount > 0}
                  headerExtra={
                    <>
                      <FiltrosInteracoesBar
                        days={days}
                        channels={channels}
                        onDaysChange={setDays}
                        onChannelsChange={setChannels}
                        onClear={clear}
                        activeCount={activeCount}
                        shownCount={recentInteractions.length}
                        totalCount={channelCounts.total}
                      />
                      <FiltrosAtivosChips
                        days={days}
                        channels={channels}
                        shownCount={recentInteractions.length}
                        totalCount={channelCounts.total}
                        onRemoveDays={() => setDays(90)}
                        onRemoveChannel={(c) => setChannels(channels.filter((x) => x !== c))}
                        onClearAll={clear}
                      />
                    </>
                  }
                />
              </div>
            </div>

            <ConversasRelacionadasCard contactId={id} channelCounts={channelCounts} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Ficha360;
