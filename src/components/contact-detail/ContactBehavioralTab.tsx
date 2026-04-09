import { useState, useEffect } from 'react';
import { Brain, Eye, Activity, Zap, Target, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import { DISCCommunicationLogsPanel } from '@/components/contact-detail/DISCCommunicationLogsPanel';
import type { Contact } from '@/hooks/useContactDetail';

const DISC_LABELS: Record<string, { name: string; color: string }> = {
  D: { name: 'Dominante', color: 'text-destructive bg-destructive dark:bg-destructive/30' },
  I: { name: 'Influente', color: 'text-warning bg-warning dark:bg-warning/30' },
  S: { name: 'Estável', color: 'text-success bg-success dark:bg-success/30' },
  C: { name: 'Conforme', color: 'text-info bg-info dark:bg-info/30' },
};

interface Props {
  contact: Contact;
}

async function fetchWithFallback<T>(
  localFn: () => Promise<{ data: T | null; error: any }>,
  extTable: string,
  filters: Array<{ type: 'eq'; column: string; value: any }>,
  options?: { order?: { column: string; ascending?: boolean }; range?: { from: number; to: number } },
): Promise<T | null> {
  const { data: local } = await localFn();
  if (local && (Array.isArray(local) ? local.length > 0 : true)) return local;
  const { data: ext } = await queryExternalData<any>({ table: extTable, filters, ...options });
  if (Array.isArray(ext) && ext.length > 0) return ext as unknown as T;
  if (ext && !Array.isArray(ext)) return ext as unknown as T;
  return Array.isArray(local) ? ([] as unknown as T) : null;
}

export function ContactBehavioralTab({ contact }: Props) {
  const { user } = useAuth();
  const [discHistory, setDiscHistory] = useState<any[]>([]);
  const [eqAnalysis, setEqAnalysis] = useState<any>(null);
  const [biases, setBiases] = useState<any>(null);
  const [metaprograms, setMetaprograms] = useState<any>(null);

  const behavior = contact.behavior as Record<string, unknown> | null;

  useEffect(() => {
    if (!user || !contact.id) return;

    const contactFilter = [{ type: 'eq' as const, column: 'contact_id', value: contact.id }];

    const fetchData = async () => {
      const [discRes, eqRes, biasRes, metaRes] = await Promise.all([
        fetchWithFallback<any[]>(
          async () => supabase.from('disc_analysis_history').select('*').eq('contact_id', contact.id).order('analyzed_at', { ascending: false }).limit(5),
          'disc_analysis_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 4 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('eq_analysis_history').select('*').eq('contact_id', contact.id).order('analyzed_at', { ascending: false }).limit(1),
          'eq_analysis_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('cognitive_bias_history').select('*').eq('contact_id', contact.id).order('analyzed_at', { ascending: false }).limit(1),
          'cognitive_bias_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('metaprogram_analysis').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(1),
          'metaprogram_analysis', contactFilter,
          { order: { column: 'created_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
      ]);

      setDiscHistory((discRes as Record<string, unknown>[]) || []);
      setEqAnalysis((eqRes as Record<string, unknown>[])?.[0] || null);
      setBiases((biasRes as Record<string, unknown>[])?.[0] || null);
      setMetaprograms((metaRes as Record<string, unknown>[])?.[0] || null);
    };

    fetchData();
  }, [user, contact.id]);

  const discProfile = behavior?.discProfile as string | null;
  const discConfidence = (behavior?.discConfidence as number) || 0;
  const vakProfile = behavior?.vakProfile as Record<string, number> | null;
  const latestDisc = discHistory[0];

  return (
    <Tabs defaultValue="disc" className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="disc" className="text-xs">DISC</TabsTrigger>
          <TabsTrigger value="vak" className="text-xs">VAK</TabsTrigger>
          <TabsTrigger value="eq" className="text-xs">Inteligência Emocional</TabsTrigger>
          <TabsTrigger value="biases" className="text-xs">Vieses Cognitivos</TabsTrigger>
          <TabsTrigger value="metaprograms" className="text-xs">Metaprogramas</TabsTrigger>
          <TabsTrigger value="personality" className="text-xs">Personalidade</TabsTrigger>
        </TabsList>
        <ModuleHelp {...moduleHelpContent.disc} />
      </div>

      {/* DISC Tab */}
      <TabsContent value="disc" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-primary" />
                Perfil DISC Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold',
                      DISC_LABELS[discProfile]?.color || 'bg-muted'
                    )}>
                      {discProfile}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{DISC_LABELS[discProfile]?.name || discProfile}</p>
                      <p className="text-xs text-muted-foreground">Confiança: {discConfidence}%</p>
                    </div>
                  </div>
                  {latestDisc && (
                    <div className="space-y-2">
                  {(['dominance_score', 'influence_score', 'steadiness_score', 'conscientiousness_score'] as const).map(key => {
                        const labels: Record<string, string> = { dominance_score: 'D', influence_score: 'I', steadiness_score: 'S', conscientiousness_score: 'C' };
                        const shortLabel = labels[key];
                        const value = (latestDisc[key] as number) || 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-6 text-xs font-bold text-muted-foreground">{shortLabel}</span>
                            <Progress value={value} className="h-2 flex-1" />
                            <span className="w-8 text-right text-xs text-muted-foreground">{value}%</span>
                          </div>
                        );
                      })}
                      {latestDisc.blend_profile && (
                        <p className="text-xs text-muted-foreground">Blend: {latestDisc.blend_profile}</p>
                      )}
                      {latestDisc.profile_summary && (
                        <p className="text-xs text-foreground mt-2">{latestDisc.profile_summary}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Perfil DISC ainda não identificado</p>
              )}
            </CardContent>
          </Card>

          {discHistory.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Histórico DISC ({discHistory.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {discHistory.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', DISC_LABELS[entry.primary_profile]?.color)}>
                          {entry.primary_profile}
                        </Badge>
                        {entry.secondary_profile && (
                          <span className="text-muted-foreground">/ {entry.secondary_profile}</span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(entry.analyzed_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* VAK Tab */}
      <TabsContent value="vak">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-secondary" />
              Perfil VAK (Visual-Auditivo-Cinestésico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vakProfile ? (
              <div className="space-y-3">
                {[
                  { key: 'visual', label: 'Visual', color: 'bg-info' },
                  { key: 'auditory', label: 'Auditivo', color: 'bg-success' },
                  { key: 'kinesthetic', label: 'Cinestésico', color: 'bg-accent' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground">{label}</span>
                    <Progress value={(vakProfile[key] || 0)} className="h-3 flex-1" />
                    <span className="w-10 text-right text-sm font-medium">{vakProfile[key] || 0}%</span>
                  </div>
                ))}
                <div className="mt-2">
                  <Badge variant="secondary">
                    Canal Primário: {String(vakProfile.primary) === 'V' ? 'Visual' : String(vakProfile.primary) === 'A' ? 'Auditivo' : 'Cinestésico'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Perfil VAK ainda não identificado</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* EQ Tab */}
      <TabsContent value="eq">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              Inteligência Emocional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eqAnalysis ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20">
                    <span className="text-2xl font-bold text-primary">{eqAnalysis.overall_score}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">{eqAnalysis.overall_level}</p>
                    {eqAnalysis.profile_summary && (
                      <p className="text-xs text-muted-foreground mt-1">{eqAnalysis.profile_summary}</p>
                    )}
                  </div>
                </div>
                {eqAnalysis.pillar_scores && typeof eqAnalysis.pillar_scores === 'object' && (
                  <div className="space-y-2">
                    {Object.entries(eqAnalysis.pillar_scores as Record<string, number>).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-32 text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <Progress value={val} className="h-2 flex-1" />
                        <span className="w-8 text-right text-xs">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {eqAnalysis.strengths && eqAnalysis.strengths.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Forças</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {eqAnalysis.strengths.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Análise EQ ainda não realizada</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cognitive Biases Tab */}
      <TabsContent value="biases">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-warning" />
              Vieses Cognitivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biases ? (
              <div className="space-y-3">
                {biases.dominant_biases && biases.dominant_biases.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Vieses Dominantes</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {biases.dominant_biases.map((b: string) => (
                        <Badge key={b} className="text-xs">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {biases.vulnerabilities && biases.vulnerabilities.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Vulnerabilidades</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {biases.vulnerabilities.map((v: string) => (
                        <Badge key={v} variant="outline" className="text-xs text-accent">{v}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {biases.resistances && biases.resistances.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Resistências</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {biases.resistances.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs text-success">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {biases.profile_summary && (
                  <p className="text-sm text-foreground">{biases.profile_summary}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Análise de vieses cognitivos ainda não realizada</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Metaprograms Tab */}
      <TabsContent value="metaprograms">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              Metaprogramas NLP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metaprograms ? (
              <div className="space-y-4">
                {[
                  { left: 'Toward', right: 'Away-From', leftVal: metaprograms.toward_score, rightVal: metaprograms.away_from_score },
                  { left: 'Interno', right: 'Externo', leftVal: metaprograms.internal_score, rightVal: metaprograms.external_score },
                  { left: 'Opções', right: 'Procedimentos', leftVal: metaprograms.options_score, rightVal: metaprograms.procedures_score },
                ].map(({ left, right, leftVal, rightVal }) => {
                  const total = (leftVal || 0) + (rightVal || 0);
                  const leftPct = total > 0 ? Math.round(((leftVal || 0) / total) * 100) : 50;
                  return (
                    <div key={left}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{left} ({leftVal || 0})</span>
                        <span>{right} ({rightVal || 0})</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
                          style={{ width: `${leftPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Análise de metaprogramas ainda não realizada</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Personality Tab */}
      <TabsContent value="personality">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Big Five */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Big Five (OCEAN)</CardTitle>
            </CardHeader>
            <CardContent>
              {behavior?.bigFiveProfile ? (
                <div className="space-y-2">
                  {[
                    { key: 'openness', label: 'Abertura' },
                    { key: 'conscientiousness', label: 'Conscienciosidade' },
                    { key: 'extraversion', label: 'Extroversão' },
                    { key: 'agreeableness', label: 'Amabilidade' },
                    { key: 'neuroticism', label: 'Neuroticismo' },
                  ].map(({ key, label }) => {
                    const profile = behavior.bigFiveProfile as Record<string, number>;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-32 text-xs text-muted-foreground">{label}</span>
                        <Progress value={profile[key] || 0} className="h-2 flex-1" />
                        <span className="w-8 text-right text-xs">{profile[key] || 0}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Não analisado</p>
              )}
            </CardContent>
          </Card>

          {/* MBTI */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">MBTI</CardTitle>
            </CardHeader>
            <CardContent>
              {behavior?.mbtiProfile ? (() => {
                const mbti = behavior.mbtiProfile as Record<string, unknown>;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="text-lg font-bold">{String(mbti.type || '?')}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Confiança: {String(mbti.confidence || 0)}%
                      </span>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-xs text-muted-foreground italic">Não analisado</p>
              )}
            </CardContent>
          </Card>

          {/* Enneagram */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Eneagrama</CardTitle>
            </CardHeader>
            <CardContent>
              {behavior?.enneagramProfile ? (() => {
                const enn = behavior.enneagramProfile as Record<string, unknown>;
                return (
                  <div className="flex items-center gap-2">
                    <Badge className="text-lg font-bold">Tipo {String(enn.type || '?')}</Badge>
                    {enn.wing && (
                      <span className="text-xs text-muted-foreground">
                        Asa {String(enn.wing)}
                      </span>
                    )}
                  </div>
                );
              })() : (
                <p className="text-xs text-muted-foreground italic">Não analisado</p>
              )}
            </CardContent>
          </Card>

          {/* Communication Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-accent" />
                Estilo de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {behavior?.preferredChannel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Canal preferido</span>
                  <Badge variant="outline" className="capitalize text-xs">{behavior.preferredChannel as string}</Badge>
                </div>
              )}
              {behavior?.messageStyle && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estilo de msg</span>
                  <Badge variant="outline" className="text-xs">{behavior.messageStyle as string}</Badge>
                </div>
              )}
              {behavior?.formalityLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Formalidade</span>
                  <span className="text-xs">{behavior.formalityLevel as number}/5</span>
                </div>
              )}
              {behavior?.decisionSpeed && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vel. decisão</span>
                  <Badge variant="outline" className="text-xs capitalize">{behavior.decisionSpeed as string}</Badge>
                </div>
              )}
              {behavior?.decisionPower && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Poder de decisão</span>
                  <span className="text-xs">{behavior.decisionPower as number}/10</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
