import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { useCompanyTimeline, useCompany360, useNextBestAction, useTouchpointSummary, useKeyContacts, useChurnRisk, useAccountPlan, usePropensityScore, useCompanyHealthScore } from '@/hooks/useCompanyIntelligence';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, Clock, Activity, Brain, AlertTriangle, Lightbulb, Phone, Target, Gauge, HeartPulse } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import type { DISCProfile } from '@/types';

type Contact = Tables<'contacts'>;

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

interface CompanyInsightsTabProps {
  companyId: string;
  contacts: Contact[];
  avgRelationshipScore: number;
  totalInteractions: number;
  positiveInteractions: number;
  pendingFollowUps: number;
}

const eventTypeIcons: Record<string, string> = {
  interaction: '💬',
  deal: '💰',
  meeting: '📅',
  task: '✅',
  proposal: '📄',
  contact: '👤',
  alert: '⚠️',
};

export function CompanyInsightsTab({ 
  companyId, contacts, avgRelationshipScore, 
  totalInteractions, positiveInteractions, pendingFollowUps 
}: CompanyInsightsTabProps) {
  const { data: timeline = [], isLoading: timelineLoading, error: timelineError, refetch: refetchTimeline } = useCompanyTimeline(companyId);
  const { data: company360, isLoading: c360Loading, error: c360Error, refetch: refetch360 } = useCompany360(companyId);
  const { data: nextAction } = useNextBestAction(companyId);
  const { data: touchpoints } = useTouchpointSummary(companyId);
  const { data: churnRisk } = useChurnRisk(companyId);
  const { data: keyContacts = [] } = useKeyContacts(companyId);
  const { data: accountPlan } = useAccountPlan(companyId);
  const { data: propensity } = usePropensityScore(companyId);
  const { data: healthScore } = useCompanyHealthScore(companyId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AccountChurnPredictionPanel companyId={companyId} />

      {/* Next Best Action */}
      {nextAction && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Próxima Ação Recomendada</span>
                  <Badge variant="outline" className="text-[10px]">{nextAction.priority}</Badge>
                </div>
                <p className="text-sm text-foreground/80">{nextAction.description}</p>
                {nextAction.reason && (
                  <p className="text-xs text-muted-foreground mt-1">💡 {nextAction.reason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn Risk inline */}
      {churnRisk && (
        <Card className={`border-l-4 ${churnRisk === 'alto' || churnRisk === 'crítico' ? 'border-l-destructive' : churnRisk === 'médio' ? 'border-l-warning' : 'border-l-success'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${churnRisk === 'alto' || churnRisk === 'crítico' ? 'text-destructive' : churnRisk === 'médio' ? 'text-warning' : 'text-success'}`} />
            <div>
              <p className="text-sm font-medium">Risco de Churn: <span className="capitalize">{churnRisk}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Score + Propensity + Account Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthScore != null && (
          <Card>
            <CardContent className="p-4 text-center">
              <HeartPulse className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className={`text-3xl font-bold ${healthScore >= 70 ? 'text-success' : healthScore >= 40 ? 'text-warning' : 'text-destructive'}`}>
                {typeof healthScore === 'object' ? (healthScore as Record<string, number>).score ?? 0 : healthScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Health Score</p>
            </CardContent>
          </Card>
        )}
        {propensity != null && (
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-primary">
                {typeof propensity === 'object' ? (propensity as Record<string, number>).score?.toFixed(0) ?? '—' : Number(propensity).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Propensão de Compra</p>
            </CardContent>
          </Card>
        )}
        {accountPlan && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Plano de Conta</span>
              </div>
              {typeof accountPlan === 'object' && (
                <div className="space-y-1.5">
                  {(accountPlan as Record<string, unknown>).objective && (
                    <p className="text-xs text-muted-foreground">🎯 {String((accountPlan as Record<string, unknown>).objective)}</p>
                  )}
                  {(accountPlan as Record<string, unknown>).strategy && (
                    <p className="text-xs text-muted-foreground">📋 {String((accountPlan as Record<string, unknown>).strategy)}</p>
                  )}
                  {(accountPlan as Record<string, unknown>).next_steps && Array.isArray((accountPlan as Record<string, unknown>).next_steps) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((accountPlan as Record<string, unknown>).next_steps as string[]).slice(0, 3).map((step, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{step}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Company 360 Intelligence Card */}
      <ExternalDataCard 
        title="Inteligência 360°" 
        icon={<Brain className="h-4 w-4" />} 
        isLoading={c360Loading} 
        error={c360Error} 
        onRetry={refetch360} 
        hasData={!!company360}
        emptyMessage="Dados de inteligência ainda não disponíveis"
      >
        {company360 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-primary" /> Visão 360°
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {company360.health_score != null && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className={`text-2xl font-bold ${company360.health_score >= 70 ? 'text-success' : company360.health_score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                      {company360.health_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Saúde</div>
                  </div>
                )}
                {company360.rfm_segment && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-sm font-semibold text-foreground">{company360.rfm_segment}</div>
                    <div className="text-xs text-muted-foreground">Segmento RFM</div>
                  </div>
                )}
                {company360.total_revenue != null && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(company360.total_revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">Receita Total</div>
                  </div>
                )}
                {company360.churn_risk != null && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className={`text-2xl font-bold ${company360.churn_risk <= 30 ? 'text-success' : company360.churn_risk <= 60 ? 'text-warning' : 'text-destructive'}`}>
                      {company360.churn_risk}%
                    </div>
                    <div className="text-xs text-muted-foreground">Risco Churn</div>
                  </div>
                )}
              </div>

              {/* Top contacts from 360 */}
              {company360.top_contacts && company360.top_contacts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Contatos Principais</p>
                  <div className="flex flex-wrap gap-2">
                    {company360.top_contacts.slice(0, 5).map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs">
                        {c.name} {c.score != null && `(${c.score}%)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </ExternalDataCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Relationship Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Saúde do Relacionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{avgRelationshipScore}%</div>
            <p className="text-sm text-muted-foreground">
              Score médio de relacionamento com {contacts.length} contatos
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0%</span><span>100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                  style={{ width: `${avgRelationshipScore}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Interações</span>
                <span className="font-semibold">{totalInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interações Positivas</span>
                <span className="font-semibold text-success">{positiveInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Follow-ups Pendentes</span>
                <span className={`font-semibold ${pendingFollowUps > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {pendingFollowUps}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos Chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contacts.slice(0, 6).map(contact => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  return (
                    <Link key={contact.id} to={`/contatos/${contact.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <OptimizedAvatar 
                          src={contact.avatar_url || undefined}
                          alt={`${contact.first_name} ${contact.last_name}`}
                          fallback={`${safeInitial(contact.first_name)}${safeInitial(contact.last_name)}`}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <div className="flex items-center gap-1">
                            {behavior?.discProfile && (
                              <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                            )}
                            <span className="text-xs text-muted-foreground">{contact.relationship_score}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Touchpoint Summary */}
      {touchpoints && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Resumo de Touchpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{touchpoints.total_touchpoints}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{touchpoints.avg_gap_days?.toFixed(0) || 0}d</div>
                <div className="text-[10px] text-muted-foreground">Gap Médio</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-sm font-medium">{touchpoints.last_touchpoint ? new Date(touchpoints.last_touchpoint).toLocaleDateString('pt-BR') : '—'}</div>
                <div className="text-[10px] text-muted-foreground">Último</div>
              </div>
            </div>
            {touchpoints.by_channel && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(touchpoints.by_channel).map(([channel, count]) => (
                  <Badge key={channel} variant="outline" className="text-[10px]">
                    {channel}: {count as number}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Contacts from RPC */}
      {keyContacts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos Estratégicos
              <Badge variant="outline" className="text-[10px] ml-auto">{keyContacts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyContacts.slice(0, 5).map((kc) => (
                <div key={kc.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{kc.name}</p>
                    {kc.role && <p className="text-[10px] text-muted-foreground">{kc.role}</p>}
                  </div>
                  <Badge variant={kc.importance_score >= 70 ? 'default' : 'secondary'} className="text-[10px]">
                    {kc.importance_score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Timeline */}
      <ExternalDataCard 
        title="Timeline da Empresa" 
        icon={<Clock className="h-4 w-4" />} 
        isLoading={timelineLoading} 
        error={timelineError} 
        onRetry={refetchTimeline} 
        hasData={timeline.length > 0}
        emptyMessage="Nenhum evento na timeline"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Timeline</span>
              <Badge variant="outline" className="text-[10px]">{timeline.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Eventos recentes da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0 max-h-80 overflow-y-auto">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              
              {timeline.map((event, i) => (
                <div key={`${event.event_date}-${i}`} className="relative pl-9 pb-4">
                  {/* Dot */}
                  <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-card z-10" />
                  
                  <div className="p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{eventTypeIcons[event.event_type] || '📌'}</span>
                      <span className="text-sm font-medium truncate">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(event.event_date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </ExternalDataCard>
    </motion.div>
  );
}
