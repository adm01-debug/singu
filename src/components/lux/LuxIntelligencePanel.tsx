import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles, Globe, Users, Building2, Brain, Target, 
  Briefcase, GraduationCap, MapPin, Clock, AlertCircle,
  CheckCircle2, Loader2, FileText, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';

interface LuxIntelligencePanelProps {
  record: LuxIntelligenceRecord | null;
  entityType: 'contact' | 'company';
  loading?: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
    pending: { label: 'Pendente', variant: 'outline', icon: Clock },
    processing: { label: 'Analisando...', variant: 'secondary', icon: Loader2 },
    completed: { label: 'Concluído', variant: 'default', icon: CheckCircle2 },
    error: { label: 'Erro', variant: 'destructive', icon: AlertCircle },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  );
};

function CompanyIntelligence({ record }: { record: LuxIntelligenceRecord }) {
  const fiscal = record.fiscal_data || {};
  const audience = record.audience_analysis || {};
  const social = record.social_analysis || {};
  const stakeholders = record.stakeholders || [];

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {record.ai_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Fiscal Data */}
      {Object.keys(fiscal).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              Dados da Receita Federal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {fiscal.cnpj && <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-medium">{fiscal.cnpj}</span></div>}
              {fiscal.razao_social && <div><span className="text-muted-foreground">Razão Social:</span> <span className="font-medium">{fiscal.razao_social}</span></div>}
              {fiscal.inscricao_estadual && <div><span className="text-muted-foreground">Insc. Estadual:</span> <span className="font-medium">{fiscal.inscricao_estadual}</span></div>}
              {fiscal.fundacao && <div><span className="text-muted-foreground">Fundação:</span> <span className="font-medium">{fiscal.fundacao}</span></div>}
              {fiscal.capital_social && <div><span className="text-muted-foreground">Capital Social:</span> <span className="font-medium">{fiscal.capital_social}</span></div>}
              {fiscal.porte && <div><span className="text-muted-foreground">Porte:</span> <span className="font-medium">{fiscal.porte}</span></div>}
              {fiscal.natureza_juridica && <div><span className="text-muted-foreground">Natureza Jurídica:</span> <span className="font-medium">{fiscal.natureza_juridica}</span></div>}
              {fiscal.situacao_cadastral && <div><span className="text-muted-foreground">Situação:</span> <span className="font-medium">{fiscal.situacao_cadastral}</span></div>}
            </div>
            {fiscal.filiais && fiscal.filiais.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Filiais ({fiscal.filiais.length})</p>
                <div className="space-y-1">
                  {fiscal.filiais.map((f: any, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {f.endereco || f.nome || `Filial ${i + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audience Analysis */}
      {Object.keys(audience).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Público-Alvo & Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {audience.target_audience && <div><span className="text-muted-foreground">Público-alvo:</span> <p className="mt-1">{audience.target_audience}</p></div>}
            {audience.communication_style && <div><span className="text-muted-foreground">Estilo de comunicação:</span> <p className="mt-1">{audience.communication_style}</p></div>}
            {audience.brand_voice && <div><span className="text-muted-foreground">Tom de voz:</span> <p className="mt-1">{audience.brand_voice}</p></div>}
            {audience.content_themes && (
              <div>
                <span className="text-muted-foreground">Temas de conteúdo:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {audience.content_themes.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Profiles */}
      {record.social_profiles && record.social_profiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-500" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.social_profiles.map((profile: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{profile.platform}</p>
                    {profile.url && <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{profile.url}</a>}
                  </div>
                  {profile.followers && <Badge variant="secondary">{profile.followers} seguidores</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stakeholders */}
      {stakeholders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Stakeholders Identificados ({stakeholders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stakeholders.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                    {(s.first_name || s.name || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name || `${s.first_name} ${s.last_name}`}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.role_title || s.position}</p>
                  </div>
                  {s.linkedin && (
                    <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">LinkedIn</a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full AI Report */}
      {record.ai_report && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Relatório Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {record.ai_report}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContactIntelligence({ record }: { record: LuxIntelligenceRecord }) {
  const profile = record.personal_profile || {};
  const social = record.social_analysis || {};

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {record.ai_summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              Resumo do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Personal Profile */}
      {Object.keys(profile).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Perfil Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.current_position && <div><span className="text-muted-foreground">Cargo atual:</span> <span className="font-medium ml-1">{profile.current_position}</span></div>}
            {profile.company && <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium ml-1">{profile.company}</span></div>}
            {profile.tenure && <div><span className="text-muted-foreground">Tempo na empresa:</span> <span className="font-medium ml-1">{profile.tenure}</span></div>}
            {profile.specialties && (
              <div>
                <span className="text-muted-foreground">Especialidades:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.specialties.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.education && profile.education.length > 0 && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Formação:</span>
                {profile.education.map((e: any, i: number) => (
                  <p key={i} className="text-xs mt-1">{typeof e === 'string' ? e : `${e.degree} - ${e.institution}`}</p>
                ))}
              </div>
            )}
            {profile.previous_companies && profile.previous_companies.length > 0 && (
              <div>
                <span className="text-muted-foreground">Empresas anteriores:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.previous_companies.map((c: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hobbies & Interests */}
      {(profile.hobbies?.length > 0 || profile.interests?.length > 0 || profile.travels?.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Interesses & Hobbies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.hobbies?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Hobbies:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.hobbies.map((h: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.interests?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Interesses:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.interests.map((h: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.travels?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Viagens recentes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.travels.map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">📍 {t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Profiles */}
      {record.social_profiles && record.social_profiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-500" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.social_profiles.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{p.platform}</p>
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{p.url}</a>}
                  </div>
                  {p.followers && <Badge variant="secondary">{p.followers} seguidores</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Analysis */}
      {Object.keys(social).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-fuchsia-500" />
              Análise de Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {social.personality_type && <div><span className="text-muted-foreground">Tipo de personalidade:</span> <span className="font-medium ml-1">{social.personality_type}</span></div>}
            {social.communication_style && <div><span className="text-muted-foreground">Estilo de comunicação:</span> <span className="font-medium ml-1">{social.communication_style}</span></div>}
            {social.content_themes && (
              <div>
                <span className="text-muted-foreground">Temas recorrentes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {social.content_themes.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full AI Report */}
      {record.ai_report && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Relatório Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {record.ai_report}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function LuxIntelligencePanel({ record, entityType, loading }: LuxIntelligencePanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="w-12 h-12 text-violet-500/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma análise Lux ainda</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Clique no botão <strong>Lux</strong> para iniciar uma varredura inteligente completa 
          {entityType === 'company' 
            ? ' desta empresa (redes sociais, dados fiscais, stakeholders e mais).'
            : ' deste contato (redes sociais, perfil profissional, interesses e mais).'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">Lux Intelligence</h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={record.status} />
          {record.completed_at && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(record.completed_at), { addSuffix: true, locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      {record.status === 'processing' && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <div>
              <p className="text-sm font-medium">Varredura em andamento...</p>
              <p className="text-xs text-muted-foreground">O n8n está coletando e analisando dados. Isso pode levar alguns minutos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {record.status === 'error' && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-medium">Erro na varredura</p>
              <p className="text-xs text-muted-foreground">{record.error_message || 'Erro desconhecido'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {record.status === 'completed' && (
        entityType === 'company' 
          ? <CompanyIntelligence record={record} />
          : <ContactIntelligence record={record} />
      )}

      {/* Fields Updated */}
      {record.fields_updated && record.fields_updated.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="py-3">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
              ✅ Campos atualizados automaticamente:
            </p>
            <div className="flex flex-wrap gap-1">
              {record.fields_updated.map((field: any, i: number) => (
                <Badge key={i} variant="outline" className="text-xs border-green-500/30">
                  {typeof field === 'string' ? field : field.field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
