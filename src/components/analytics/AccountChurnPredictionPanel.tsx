import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Building2,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAccountChurnPrediction, 
  AccountChurnRisk,
  AccountRiskFactor 
} from '@/hooks/useAccountChurnPrediction';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface AccountChurnPredictionPanelProps {
  companyId?: string;
  compact?: boolean;
}

export function AccountChurnPredictionPanel({ 
  companyId, 
  compact = false 
}: AccountChurnPredictionPanelProps) {
  const { 
    accountChurnAnalysis,
    atRiskAccounts, 
    criticalCount, 
    highRiskCount,
    portfolioHealthScore,
    loading 
  } = useAccountChurnPrediction();

  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  // If companyId is provided, show only that company
  const displayedAccounts = companyId 
    ? accountChurnAnalysis.filter(a => a.companyId === companyId)
    : atRiskAccounts.slice(0, compact ? 3 : 10);

  const singleAccount = companyId ? displayedAccounts[0] : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-yellow-500';
      default: return 'text-emerald-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive/10 border-destructive/30';
      case 'high': return 'bg-warning/10 border-warning/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 70) return <ShieldCheck className="h-5 w-5 text-emerald-500" />;
    if (score >= 40) return <Shield className="h-5 w-5 text-yellow-500" />;
    return <ShieldAlert className="h-5 w-5 text-destructive" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStakeholderIcon = (type: string) => {
    switch (type) {
      case 'champion': return '🌟';
      case 'supporter': return '👍';
      case 'neutral': return '😐';
      case 'blocker': return '🚫';
      default: return '❓';
    }
  };

  // Single account view (when companyId is provided)
  if (singleAccount) {
    return (
      <Card className={cn("border", getRiskBgColor(singleAccount.riskLevel))}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("h-5 w-5", getRiskColor(singleAccount.riskLevel))} />
              <CardTitle className="text-lg">Risco de Churn da Conta</CardTitle>
            </div>
            <Badge className={cn(getRiskBadgeColor(singleAccount.riskLevel))}>
              {singleAccount.riskLevel === 'critical' ? 'Crítico' :
               singleAccount.riskLevel === 'high' ? 'Alto' :
               singleAccount.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Score Gauge */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={cn("text-4xl font-bold", getRiskColor(singleAccount.riskLevel))}>
                  {singleAccount.riskScore}%
                </span>
                <span className="text-muted-foreground text-sm">risco de churn</span>
              </div>
              <Progress 
                value={singleAccount.riskScore} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Confiança: {singleAccount.confidenceLevel}%
              </p>
            </div>
          </div>

          {/* Stakeholder Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-600">{singleAccount.championCount}</div>
              <div className="text-xs text-muted-foreground">Champions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-muted-foreground">{singleAccount.neutralCount}</div>
              <div className="text-xs text-muted-foreground">Neutros</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <div className="text-2xl font-bold text-destructive">{singleAccount.blockerCount}</div>
              <div className="text-xs text-muted-foreground">Bloqueadores</div>
            </div>
          </div>

          {/* Risk Factors */}
          {singleAccount.riskFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Fatores de Risco
              </h4>
              <div className="space-y-2">
                {singleAccount.riskFactors.map((factor, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{factor.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{factor.factor}</p>
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{factor.impact}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Ações Recomendadas
            </h4>
            <ul className="space-y-1">
              {singleAccount.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Risk Distribution */}
          {singleAccount.contacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Stakeholders ({singleAccount.contacts.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {singleAccount.contacts.map((contact) => (
                  <Link
                    key={contact.contactId}
                    to={`/contatos/${contact.contactId}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getStakeholderIcon(contact.stakeholderType)}</span>
                      <div>
                        <p className="text-sm font-medium">{contact.contactName}</p>
                        {contact.role && (
                          <p className="text-xs text-muted-foreground">{contact.role}</p>
                        )}
                      </div>
                    </div>
                    {contact.recentAlertCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {contact.recentAlertCount} alertas
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Portfolio view (when no companyId)
  return (
    <Card className={cn(!compact && "col-span-full")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {getHealthIcon(portfolioHealthScore)}
          <div>
            <CardTitle className="text-lg">Risco de Churn por Conta</CardTitle>
            <p className="text-sm text-muted-foreground">
              Baseado em stakeholders e padrões de engajamento
            </p>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Crítico: {criticalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">Alto: {highRiskCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Saúde do Portfólio: 
                <span className={cn(
                  "font-medium ml-1",
                  portfolioHealthScore >= 70 ? "text-emerald-500" :
                  portfolioHealthScore >= 40 ? "text-yellow-500" : "text-destructive"
                )}>
                  {portfolioHealthScore}%
                </span>
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayedAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-50" />
            <p className="font-medium">Nenhuma conta em risco</p>
            <p className="text-sm">Todas as suas contas estão saudáveis!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAccounts.map((account, index) => (
              <motion.div
                key={account.companyId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    getRiskBgColor(account.riskLevel),
                    expandedAccount === account.companyId && "ring-2 ring-primary"
                  )}
                  onClick={() => setExpandedAccount(
                    expandedAccount === account.companyId ? null : account.companyId
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedAccount === account.companyId ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Link 
                          to={`/empresas/${account.companyId}`}
                          className="font-medium hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {account.companyName}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {account.contacts.length} stakeholders
                          </span>
                          <span className="flex items-center gap-1">
                            {getTrendIcon(account.engagementTrend)}
                            {account.engagementTrend === 'improving' ? 'Melhorando' :
                             account.engagementTrend === 'declining' ? 'Declinando' :
                             account.engagementTrend === 'critical' ? 'Crítico' : 'Estável'}
                          </span>
                          {account.criticalAlerts > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              {account.criticalAlerts} alertas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🌟 {account.championCount}</span>
                        <span className="text-xs">🚫 {account.blockerCount}</span>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-2xl font-bold", getRiskColor(account.riskLevel))}>
                          {account.riskScore}%
                        </div>
                        <Badge className={cn("text-xs", getRiskBadgeColor(account.riskLevel))}>
                          {account.riskLevel === 'critical' ? 'Crítico' :
                           account.riskLevel === 'high' ? 'Alto' :
                           account.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedAccount === account.companyId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Risk Factors */}
                        {account.riskFactors.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Fatores de Risco</h5>
                            <div className="flex flex-wrap gap-2">
                              {account.riskFactors.map((factor, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {factor.icon} {factor.factor} (+{factor.impact}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Ações Recomendadas</h5>
                          <ul className="space-y-1">
                            {account.recommendedActions.slice(0, 3).map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* View Account Button */}
                        <div className="flex justify-end">
                          <Link to={`/empresas/${account.companyId}`}>
                            <Button size="sm" variant="outline">
                              Ver Conta
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {atRiskAccounts.length > displayedAccounts.length && (
              <div className="text-center pt-2">
                <Link to="/analytics">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Ver todas ({atRiskAccounts.length} contas em risco)
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
