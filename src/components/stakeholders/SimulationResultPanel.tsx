import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SimulationResult } from '@/hooks/useStakeholderSimulator';

export function SimulationResultPanel({ result }: { result: SimulationResult }) {
  const getEffortColor = () => {
    switch (result.effortRequired) {
      case 'low': return 'text-success bg-success/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'high': return 'text-destructive bg-destructive/10';
    }
  };

  const getEffortLabel = () => {
    switch (result.effortRequired) {
      case 'low': return 'Baixo';
      case 'medium': return 'Médio';
      case 'high': return 'Alto';
    }
  };

  const getProbabilityColor = () => {
    if (result.successProbability >= 70) return 'text-success';
    if (result.successProbability >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Power Balance Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            Comparação de Balanço de Poder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Atual</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div className="bg-success" style={{ width: `${result.originalPowerBalance.supportPower}%` }} />
              <div className="bg-warning" style={{ width: `${result.originalPowerBalance.neutralPower}%` }} />
              <div className="bg-destructive" style={{ width: `${result.originalPowerBalance.oppositionPower}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-success">{result.originalPowerBalance.supportPower}%</span>
              <span className="text-warning">{result.originalPowerBalance.neutralPower}%</span>
              <span className="text-destructive">{result.originalPowerBalance.oppositionPower}%</span>
            </div>
          </div>

          {/* Simulated */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Simulado</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="bg-success"
                initial={{ width: `${result.originalPowerBalance.supportPower}%` }}
                animate={{ width: `${result.simulatedPowerBalance.supportPower}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="bg-warning"
                initial={{ width: `${result.originalPowerBalance.neutralPower}%` }}
                animate={{ width: `${result.simulatedPowerBalance.neutralPower}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              <motion.div
                className="bg-destructive"
                initial={{ width: `${result.originalPowerBalance.oppositionPower}%` }}
                animate={{ width: `${result.simulatedPowerBalance.oppositionPower}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-success">{result.simulatedPowerBalance.supportPower}%</span>
              <span className="text-warning">{result.simulatedPowerBalance.neutralPower}%</span>
              <span className="text-destructive">{result.simulatedPowerBalance.oppositionPower}%</span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm">Score de Risco</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={result.originalRiskScore > 50 ? 'text-destructive' : 'text-warning'}>
                {result.originalRiskScore}%
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Badge className={result.simulatedRiskScore > 50 ? 'bg-destructive' : result.simulatedRiskScore > 25 ? 'bg-warning' : 'bg-success'}>
                {result.simulatedRiskScore}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className={`text-2xl font-bold ${getProbabilityColor()}`}>
              {result.successProbability}%
            </div>
            <div className="text-xs text-muted-foreground">Probabilidade</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Badge className={getEffortColor()}>
              {getEffortLabel()}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">Esforço</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-info" />
              <span className="text-sm font-medium">{result.timeEstimate}</span>
            </div>
            <div className="text-xs text-muted-foreground">Estimativa</div>
          </CardContent>
        </Card>
      </div>

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-success">
              <CheckCircle2 className="w-4 h-4" />
              Melhorias Esperadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-success" />
                  {improvement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {result.risks.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Riscos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.risks.map((risk, idx) => (
                <li key={idx} className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Target className="w-4 h-4" />
            Recomendação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{result.recommendation}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
