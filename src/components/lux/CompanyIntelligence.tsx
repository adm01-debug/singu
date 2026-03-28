import { useState } from 'react';
import {
  Brain, Building2, Target, Globe, Users,
  FileText, MapPin, Copy, Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';
import { toast } from 'sonner';
import { DataCard, SocialProfileCard, StakeholderCard } from './LuxIntelligenceShared';
import type { SocialProfile, Stakeholder } from './LuxIntelligenceShared';

export function CompanyIntelligence({ record }: { record: LuxIntelligenceRecord }) {
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
          <DataCard title="Resumo Executivo" icon={Brain} iconColor="bg-violet-100 dark:bg-violet-900/30 text-violet-600">
            <p className="text-sm text-muted-foreground leading-relaxed">{record.ai_summary}</p>
          </DataCard>
        )}

        {record.ai_report && (
          <DataCard title="Relatório Completo" icon={FileText} iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600">
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
          <DataCard title="Dados da Receita Federal" icon={Building2} iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600">
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
                        <Check className="w-3 h-3 text-emerald-500" />
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
                    {fiscal.filiais.map((f: { endereco?: string; nome?: string }, i: number) => (
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
          <DataCard title="Público-Alvo & Comunicação" icon={Target} iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-600">
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
                      <Badge key={i} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
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
          <DataCard title="Redes Sociais" icon={Globe} iconColor="bg-green-100 dark:bg-green-900/30 text-green-600">
            <div className="space-y-2">
              {socialProfiles.map((profile, i: number) => (
                <SocialProfileCard key={i} profile={profile as unknown as SocialProfile} />
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
          <DataCard title={`Stakeholders Identificados (${stakeholders.length})`} icon={Users} iconColor="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
            <div className="space-y-2">
              {stakeholders.map((s, i: number) => (
                <StakeholderCard key={i} stakeholder={s as unknown as Stakeholder} index={i} />
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
