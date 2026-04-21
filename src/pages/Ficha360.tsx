import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, User } from 'lucide-react';
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
import { ScoreProntidaoCard } from '@/components/ficha-360/ScoreProntidaoCard';
import { ProximosPassosCard } from '@/components/ficha-360/ProximosPassosCard';
import { computeProntidaoScore } from '@/lib/prontidaoScore';
import { computeProximosPassos } from '@/lib/proximosPassos';
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

  const prontidao = useMemo(
    () => computeProntidaoScore({ profile, intelligence }),
    [profile, intelligence],
  );

  const passos = useMemo(
    () =>
      computeProximosPassos({
        profile,
        intelligence,
        recentInteractions,
        prontidao,
        birthday: rapportIntel?.birthday ?? null,
        email: intelligence?.email ?? null,
      }),
    [profile, intelligence, recentInteractions, prontidao, rapportIntel],
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
            <ScoreProntidaoCard data={prontidao} />

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
                <ProximosPassosCard contactId={id} contactName={fullName} passos={passos} />
                <UltimasInteracoesCard
                  interactions={recentInteractions}
                  contactId={id}
                  filtersActive={activeCount > 0}
                  headerExtra={
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
