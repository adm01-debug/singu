import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Globe, Users, Building2, Brain, Target, 
  Briefcase, GraduationCap, MapPin, Clock, AlertCircle,
  CheckCircle2, Loader2, FileText, TrendingUp, Linkedin,
  Instagram, Twitter, ExternalLink, Copy, Check, 
  BarChart3, Heart, Plane, Award, Calendar, Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LuxButton } from './LuxButton';
import { LuxHistoryTimeline } from './LuxHistoryTimeline';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';
import { toast } from 'sonner';

interface LuxIntelligencePanelProps {
  record: LuxIntelligenceRecord | null;
  records?: LuxIntelligenceRecord[];
  entityType: 'contact' | 'company';
  loading?: boolean;
  onTrigger?: () => void;
  triggering?: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2; color: string }> = {
    pending: { label: 'Pendente', variant: 'outline', icon: Clock, color: 'text-muted-foreground' },
    processing: { label: 'Analisando...', variant: 'secondary', icon: Loader2, color: 'text-warning' },
    completed: { label: 'Concluído', variant: 'default', icon: CheckCircle2, color: 'text-success' },
    error: { label: 'Erro', variant: 'destructive', icon: AlertCircle, color: 'text-destructive' },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className={`gap-1.5 ${c.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  );
};

const DataCard = ({ 
  title, 
  icon: Icon, 
  iconColor, 
  children,
  className = ''
}: { 
  title: string; 
  icon: typeof Brain;
  iconColor: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);

const SocialProfileCard = ({ profile }: { profile: any }) => {
  const platformIcons: Record<string, typeof Linkedin> = {
    linkedin: Linkedin,
    instagram: Instagram,
    twitter: Twitter,
    default: Globe,
  };
  
  const Icon = platformIcons[profile.platform?.toLowerCase()] || platformIcons.default;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all">
      <div className="p-2 rounded-lg bg-background shadow-sm">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.platform}</p>
        {profile.username && (
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {profile.followers && (
          <Badge variant="secondary" className="text-xs">
            {typeof profile.followers === 'number' 
              ? profile.followers.toLocaleString('pt-BR')
              : profile.followers} seguidores
          </Badge>
        )}
        {profile.url && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={profile.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

const StakeholderCard = ({ stakeholder, index }: { stakeholder: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/50 to-secondary/50 dark:from-primary/20 dark:to-secondary/20 border border-primary/50 dark:border-primary/30"
  >
    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
      {(stakeholder.first_name || stakeholder.name || '?').charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">
        {stakeholder.name || `${stakeholder.first_name || ''} ${stakeholder.last_name || ''}`.trim() || 'Nome não disponível'}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {stakeholder.role_title || stakeholder.position || 'Cargo não identificado'}
      </p>
    </div>
    <div className="flex items-center gap-1">
      {stakeholder.email && (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={`mailto:${stakeholder.email}`}>
            <Share2 className="w-3.5 h-3.5" />
          </a>
        </Button>
      )}
      {stakeholder.linkedin && (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={stakeholder.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin className="w-3.5 h-3.5" />
          </a>
        </Button>
      )}
    </div>
  </motion.div>
);

function CompanyIntelligence({ record }: { record: LuxIntelligenceRecord }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fiscal = record.fiscal_data || {};
  const audience = record.audience_analysis || {};
  const social = record.social_analysis || {};
  const stakeholders = record.stakeholders || [];
  const socialProfiles = record.social_profiles || [];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado para área de transferência');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5 h-auto p-1">
        <TabsTrigger value="summary" className="text-xs py-2">
          <Brain className="w-3.5 h-3.5 mr-1.5" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="fiscal" className="text-xs py-2">
          <Building2 className="w-3.5 h-3.5 mr-1.5" />
          Fiscal
        </TabsTrigger>
        <TabsTrigger value="audience" className="text-xs py-2">
          <Target className="w-3.5 h-3.5 mr-1.5" />
          Público
        </TabsTrigger>
        <TabsTrigger value="social" className="text-xs py-2">
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          Social
        </TabsTrigger>
        <TabsTrigger value="stakeholders" className="text-xs py-2">
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Pessoas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-4">
        {record.ai_summary && (
          <DataCard title="Resumo Executivo" icon={Brain} iconColor="bg-violet-100 dark:bg-secondary/30 text-secondary">
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </DataCard>
        )}
        
        {record.ai_report && (
          <DataCard title="Relatório Completo" icon={FileText} iconColor="bg-info dark:bg-info/30 text-info">
            <ScrollArea className="max-h-96">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {record.ai_report}
              </div>
            </ScrollArea>
          </DataCard>
        )}

        {!record.ai_summary && !record.ai_report && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Resumo ainda não disponível</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="fiscal" className="space-y-4">
        {Object.keys(fiscal).length > 0 ? (
          <DataCard title="Dados da Receita Federal" icon={Building2} iconColor="bg-info dark:bg-info/30 text-info">
            <div className="space-y-3">
              {[
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'razao_social', label: 'Razão Social' },
                { key: 'inscricao_estadual', label: 'Inscrição Estadual' },
                { key: 'fundacao', label: 'Data de Fundação' },
                { key: 'capital_social', label: 'Capital Social' },
                { key: 'porte', label: 'Porte' },
                { key: 'natureza_juridica', label: 'Natureza Jurídica' },
                { key: 'situacao_cadastral', label: 'Situação Cadastral' },
                { key: 'cnae_principal', label: 'CNAE Principal' },
              ].map(({ key, label }) => fiscal[key] && (
                <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{fiscal[key]}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(fiscal[key], key)}
                    >
                      {copiedField === key ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              {fiscal.filiais && fiscal.filiais.length > 0 && (
                <div className="pt-3">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Filiais ({fiscal.filiais.length})
                  </p>
                  <div className="space-y-2">
                    {fiscal.filiais.map((f: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.endereco || f.nome || `Filial ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DataCard>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Dados fiscais não disponíveis</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="audience" className="space-y-4">
        {Object.keys(audience).length > 0 ? (
          <DataCard title="Público-Alvo & Comunicação" icon={Target} iconColor="bg-accent dark:bg-accent/30 text-accent">
            <div className="space-y-4">
              {audience.target_audience && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Público-alvo</p>
                  <p className="text-sm">{audience.target_audience}</p>
                </div>
              )}
              {audience.communication_style && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estilo de Comunicação</p>
                  <p className="text-sm">{audience.communication_style}</p>
                </div>
              )}
              {audience.brand_voice && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tom de Voz</p>
                  <p className="text-sm">{audience.brand_voice}</p>
                </div>
              )}
              {audience.content_themes && audience.content_themes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Temas de Conteúdo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {audience.content_themes.map((t: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs bg-accent dark:bg-accent/20 border-orange-200 dark:border-orange-800">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DataCard>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Análise de público não disponível</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="social" className="space-y-4">
        {socialProfiles.length > 0 ? (
          <DataCard title="Redes Sociais" icon={Globe} iconColor="bg-success dark:bg-success/30 text-success">
            <div className="space-y-2">
              {socialProfiles.map((profile: any, i: number) => (
                <SocialProfileCard key={i} profile={profile} />
              ))}
            </div>
          </DataCard>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Perfis sociais não encontrados</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="stakeholders" className="space-y-4">
        {stakeholders.length > 0 ? (
          <DataCard title={`Stakeholders Identificados (${stakeholders.length})`} icon={Users} iconColor="bg-primary dark:bg-primary/30 text-primary">
            <div className="space-y-2">
              {stakeholders.map((s: any, i: number) => (
                <StakeholderCard key={i} stakeholder={s} index={i} />
              ))}
            </div>
          </DataCard>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Nenhum stakeholder identificado</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ContactIntelligence({ record }: { record: LuxIntelligenceRecord }) {
  const profile = record.personal_profile || {};
  const social = record.social_analysis || {};
  const socialProfiles = record.social_profiles || [];

  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
        <TabsTrigger value="summary" className="text-xs py-2">
          <Brain className="w-3.5 h-3.5 mr-1.5" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="professional" className="text-xs py-2">
          <Briefcase className="w-3.5 h-3.5 mr-1.5" />
          Profissional
        </TabsTrigger>
        <TabsTrigger value="personal" className="text-xs py-2">
          <Heart className="w-3.5 h-3.5 mr-1.5" />
          Pessoal
        </TabsTrigger>
        <TabsTrigger value="social" className="text-xs py-2">
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          Social
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-4">
        {record.ai_summary && (
          <DataCard title="Resumo do Perfil" icon={Brain} iconColor="bg-violet-100 dark:bg-secondary/30 text-secondary">
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </DataCard>
        )}
        
        {record.ai_report && (
          <DataCard title="Relatório Completo" icon={FileText} iconColor="bg-info dark:bg-info/30 text-info">
            <ScrollArea className="max-h-96">
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {record.ai_report}
              </div>
            </ScrollArea>
          </DataCard>
        )}

        {!record.ai_summary && !record.ai_report && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Resumo ainda não disponível</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="professional" className="space-y-4">
        {Object.keys(profile).length > 0 ? (
          <>
            <DataCard title="Perfil Profissional" icon={Briefcase} iconColor="bg-info dark:bg-info/30 text-info">
              <div className="space-y-3">
                {profile.current_position && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Cargo Atual</span>
                    <span className="text-sm font-medium">{profile.current_position}</span>
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Empresa</span>
                    <span className="text-sm font-medium">{profile.company}</span>
                  </div>
                )}
                {profile.tenure && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Tempo na Empresa</span>
                    <Badge variant="outline">{profile.tenure}</Badge>
                  </div>
                )}
                {profile.specialties && profile.specialties.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Especialidades
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.specialties.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DataCard>

            {profile.education && profile.education.length > 0 && (
              <DataCard title="Formação" icon={GraduationCap} iconColor="bg-success dark:bg-success/30 text-success">
                <div className="space-y-3">
                  {profile.education.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">
                        {typeof e === 'string' ? e : e.degree}
                      </p>
                      {typeof e !== 'string' && e.institution && (
                        <p className="text-xs text-muted-foreground mt-1">{e.institution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </DataCard>
            )}

            {profile.previous_companies && profile.previous_companies.length > 0 && (
              <DataCard title="Empresas Anteriores" icon={Building2} iconColor="bg-slate-100 dark:bg-muted/30 text-muted-foreground">
                <div className="flex flex-wrap gap-1.5">
                  {profile.previous_companies.map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </DataCard>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Dados profissionais não disponíveis</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="personal" className="space-y-4">
        {(profile.hobbies?.length > 0 || profile.interests?.length > 0 || profile.travels?.length > 0) ? (
          <>
            {profile.hobbies && profile.hobbies.length > 0 && (
              <DataCard title="Hobbies" icon={Heart} iconColor="bg-primary dark:bg-primary/30 text-primary">
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map((h: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-primary dark:bg-primary/20 border-pink-200 dark:border-pink-800">
                      {h}
                    </Badge>
                  ))}
                </div>
              </DataCard>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <DataCard title="Interesses" icon={TrendingUp} iconColor="bg-warning dark:bg-warning/30 text-warning">
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((h: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-warning dark:bg-warning/20 border-amber-200 dark:border-amber-800">
                      {h}
                    </Badge>
                  ))}
                </div>
              </DataCard>
            )}

            {profile.travels && profile.travels.length > 0 && (
              <DataCard title="Viagens Recentes" icon={Plane} iconColor="bg-sky-100 dark:bg-sky-900/30 text-sky-600">
                <div className="flex flex-wrap gap-1.5">
                  {profile.travels.map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      📍 {t}
                    </Badge>
                  ))}
                </div>
              </DataCard>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Dados pessoais não disponíveis</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="social" className="space-y-4">
        {socialProfiles.length > 0 && (
          <DataCard title="Redes Sociais" icon={Globe} iconColor="bg-success dark:bg-success/30 text-success">
            <div className="space-y-2">
              {socialProfiles.map((p: any, i: number) => (
                <SocialProfileCard key={i} profile={p} />
              ))}
            </div>
          </DataCard>
        )}

        {Object.keys(social).length > 0 && (
          <DataCard title="Análise de Comportamento Social" icon={BarChart3} iconColor="bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600">
            <div className="space-y-3">
              {social.personality_type && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo de Personalidade</p>
                  <Badge variant="secondary">{social.personality_type}</Badge>
                </div>
              )}
              {social.communication_style && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estilo de Comunicação</p>
                  <p className="text-sm">{social.communication_style}</p>
                </div>
              )}
              {social.content_themes && social.content_themes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Temas Recorrentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {social.content_themes.map((t: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DataCard>
        )}

        {socialProfiles.length === 0 && Object.keys(social).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm">Dados sociais não disponíveis</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function LuxIntelligencePanel({ 
  record, 
  records = [], 
  entityType, 
  loading,
  onTrigger,
  triggering 
}: LuxIntelligencePanelProps) {
  const [selectedRecord, setSelectedRecord] = useState<LuxIntelligenceRecord | null>(record);
  const displayRecord = selectedRecord || record;
  const allRecords = records.length > 0 ? records : (record ? [record] : []);

  // Update selected when record changes
  if (record && !selectedRecord) {
    setSelectedRecord(record);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-secondary" />
        </motion.div>
        <span className="ml-3 text-sm text-muted-foreground">Carregando dados Lux...</span>
      </div>
    );
  }

  if (!displayRecord) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-16 h-16 text-secondary/40 mb-4" />
        </motion.div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma análise Lux ainda
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Ative o Lux Intelligence para coletar dados públicos da internet, analisar redes sociais e gerar insights valiosos sobre {entityType === 'company' ? 'esta empresa' : 'este contato'}.
        </p>
        {onTrigger && (
          <LuxButton 
            onClick={onTrigger} 
            loading={triggering} 
            processing={false}
          />
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-premium text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Lux Intelligence</h3>
            <p className="text-xs text-muted-foreground">
              {displayRecord.completed_at 
                ? `Última análise: ${formatDistanceToNow(new Date(displayRecord.completed_at), { locale: ptBR, addSuffix: true })}`
                : displayRecord.started_at
                  ? `Iniciado ${formatDistanceToNow(new Date(displayRecord.started_at), { locale: ptBR, addSuffix: true })}`
                  : 'Aguardando processamento'
              }
            </p>
          </div>
        </div>
        <StatusBadge status={displayRecord.status} />
      </div>

      {/* Processing Animation */}
      <AnimatePresence>
        {displayRecord.status === 'processing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-secondary/30 dark:to-fuchsia-950/30">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-8 h-8 text-secondary" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Varredura em andamento...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Coletando dados de redes sociais, sites públicos e APIs oficiais
                    </p>
                    <div className="mt-3">
                      <motion.div
                        className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full"
                        animate={{ 
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ backgroundSize: '200% 100%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {displayRecord.status === 'error' && displayRecord.error_message && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Erro na varredura</p>
                <p className="text-xs text-destructive/80 mt-1">{displayRecord.error_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      {displayRecord.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* History Timeline */}
          <div className="lg:col-span-1">
            <LuxHistoryTimeline
              records={allRecords}
              selectedId={displayRecord.id}
              onSelect={(r) => setSelectedRecord(r)}
            />
          </div>

          {/* Intelligence Data */}
          <div className="lg:col-span-3">
            {entityType === 'company' ? (
              <CompanyIntelligence record={displayRecord} />
            ) : (
              <ContactIntelligence record={displayRecord} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
