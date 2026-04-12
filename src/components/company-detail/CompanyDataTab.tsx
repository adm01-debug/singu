import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FileBarChart, Hash, Star, TrendingUp, Users2, Loader2, BarChart3, Copy } from 'lucide-react';
import { useCompanyStatistics, useCompanyDuplicates } from '@/hooks/useCompanyIntelligence';
import type { CompanyCnae, CompanyRfmScore, CompanyStakeholder } from '@/hooks/useCompanyRelatedData';

interface CompanyDataTabProps {
  cnaes: CompanyCnae[];
  rfmScores: CompanyRfmScore[];
  stakeholders: CompanyStakeholder[];
  loading?: boolean;
  companyId?: string;
}

function RfmScoreBar({ label, value }: { label: string; value?: number }) {
  const score = value ?? 0;
  const pct = Math.min(score * 20, 100); // 1-5 scale → 0-100%
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/5</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CompanyDataTab({ cnaes, rfmScores, stakeholders, loading, companyId }: CompanyDataTabProps) {
  const { data: statistics } = useCompanyStatistics(companyId);
  const { data: duplicates } = useCompanyDuplicates(companyId);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasCnaes = cnaes.length > 0;
  const hasRfm = rfmScores.length > 0;
  const hasStakeholders = stakeholders.length > 0;
  const isEmpty = !hasCnaes && !hasRfm && !hasStakeholders;

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileBarChart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum dado complementar disponível para esta empresa.</p>
        </CardContent>
      </Card>
    );
  }

  const latestRfm = rfmScores[0];
  const sortedCnaes = [...cnaes].sort((a, b) => (b.is_principal ? 1 : 0) - (a.is_principal ? 1 : 0));

  return (
    <div className="space-y-4">
      {/* CNAEs */}
      {hasCnaes && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                CNAEs ({cnaes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedCnaes.map((cnae) => (
                  <div key={cnae.id || cnae.codigo} className="flex items-start gap-2 text-sm">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {cnae.codigo}
                    </code>
                    <span className="text-muted-foreground flex-1">{cnae.descricao || '—'}</span>
                    {cnae.is_principal && (
                      <Badge variant="default" className="text-xs flex-shrink-0">Principal</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* RFM Analysis */}
      {hasRfm && latestRfm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Análise RFM
                {latestRfm.rfm_segment && (
                  <Badge variant="outline" className="ml-auto text-xs">{latestRfm.rfm_segment}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <RfmScoreBar label="Recência" value={latestRfm.recency_score} />
                <RfmScoreBar label="Frequência" value={latestRfm.frequency_score} />
                <RfmScoreBar label="Monetário" value={latestRfm.monetary_score} />
              </div>
              {(latestRfm.total_purchases || latestRfm.total_revenue) && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  {latestRfm.total_purchases != null && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{latestRfm.total_purchases}</div>
                      <div className="text-xs text-muted-foreground">Compras</div>
                    </div>
                  )}
                  {latestRfm.total_revenue != null && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(Number(latestRfm.total_revenue))}
                      </div>
                      <div className="text-xs text-muted-foreground">Receita Total</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stakeholders */}
      {hasStakeholders && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                Mapa de Stakeholders ({stakeholders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stakeholders.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {(s.nome || s.cargo || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.nome || 'Sem nome'}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[s.cargo, s.departamento].filter(Boolean).join(' • ') || s.papel || '—'}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {s.nivel_influencia != null && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-0.5" />
                          {s.nivel_influencia}
                        </Badge>
                      )}
                      {s.nivel_decisao != null && (
                        <Badge variant="secondary" className="text-xs">
                          Decisão: {s.nivel_decisao}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Company Statistics */}
      {statistics && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(statistics as Record<string, unknown>).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-muted/30 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-bold">{String(value ?? '—')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Company Duplicates */}
      {duplicates && Array.isArray(duplicates) && duplicates.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-warning/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Copy className="h-4 w-4 text-warning" />
                Possíveis Duplicatas
                <Badge variant="outline" className="text-[10px] ml-auto text-warning">{duplicates.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(duplicates as Array<Record<string, unknown>>).map((dup, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/10">
                    <div>
                      <p className="text-sm font-medium">{String(dup.name || dup.razao_social || 'N/A')}</p>
                      {dup.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {String(dup.cnpj)}</p>}
                    </div>
                    {dup.similarity_score != null && (
                      <Badge variant="outline" className="text-[10px]">{Number(dup.similarity_score).toFixed(0)}% similar</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
