import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Save,
  Trash2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Users,
  UserCheck,
  UserX,
  Minus,
  Sparkles,
  FolderOpen,
  X,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStakeholderSimulator, SimulatedChange, SimulationResult } from '@/hooks/useStakeholderSimulator';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';

interface StakeholderSimulatorProps {
  stakeholders: StakeholderData[];
  className?: string;
}

const SUPPORT_LABELS: Record<number, { label: string; color: string; icon: typeof UserCheck }> = {
  5: { label: 'Champion', color: 'text-success', icon: UserCheck },
  4: { label: 'Forte Apoiador', color: 'text-success', icon: TrendingUp },
  3: { label: 'Apoiador', color: 'text-success', icon: TrendingUp },
  2: { label: 'Apoiador Leve', color: 'text-success/70', icon: TrendingUp },
  1: { label: 'Levemente Positivo', color: 'text-muted-foreground', icon: Minus },
  0: { label: 'Neutro', color: 'text-muted-foreground', icon: Minus },
  [-1]: { label: 'Levemente Negativo', color: 'text-muted-foreground', icon: Minus },
  [-2]: { label: 'Cético', color: 'text-warning', icon: TrendingDown },
  [-3]: { label: 'Opositor', color: 'text-destructive/70', icon: TrendingDown },
  [-4]: { label: 'Forte Opositor', color: 'text-destructive', icon: UserX },
  [-5]: { label: 'Bloqueador', color: 'text-destructive', icon: UserX },
};

function getSupportLabel(support: number) {
  return SUPPORT_LABELS[support] || SUPPORT_LABELS[0];
}

function StakeholderSelector({ 
  stakeholder, 
  isSelected, 
  currentChange,
  onSelect,
  onChangeSupport,
}: { 
  stakeholder: StakeholderData;
  isSelected: boolean;
  currentChange?: SimulatedChange;
  onSelect: () => void;
  onChangeSupport: (support: number) => void;
}) {
  const currentSupport = currentChange?.newMetrics.support ?? stakeholder.metrics.support;
  const supportLabel = getSupportLabel(currentSupport);
  const originalLabel = getSupportLabel(stakeholder.metrics.support);
  const hasChanged = currentChange !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : hasChanged 
            ? 'border-warning/50 bg-warning/5' 
            : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={stakeholder.contact.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted">
            {(stakeholder.contact.first_name || '?')[0]}{(stakeholder.contact.last_name || '?')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {stakeholder.contact.first_name} {stakeholder.contact.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {stakeholder.contact.role_title}
          </p>
        </div>
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          onClick={onSelect}
        >
          {isSelected ? 'Selecionado' : 'Simular'}
        </Button>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-3 border-t"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Suporte</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={originalLabel.color}>
                {stakeholder.metrics.support > 0 ? '+' : ''}{stakeholder.metrics.support}
              </Badge>
              {hasChanged && (
                <>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Badge className={`${supportLabel.color} bg-opacity-20`}>
                    {currentSupport > 0 ? '+' : ''}{currentSupport}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <Slider
            value={[currentSupport]}
            min={-5}
            max={5}
            step={1}
            onValueChange={([value]) => onChangeSupport(value)}
            className="mb-2"
          />
          
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Bloqueador</span>
            <span>Neutro</span>
            <span>Champion</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function SimulationResultPanel({ result }: { result: SimulationResult }) {
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

export function StakeholderSimulator({ stakeholders, className }: StakeholderSimulatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');

  const {
    changes,
    addChange,
    removeChange,
    clearChanges,
    applyPreset,
    savedScenarios,
    saveScenario,
    loadScenario,
    deleteScenario,
    simulationResult,
  } = useStakeholderSimulator(stakeholders);

  const handleChangeSupport = (stakeholder: StakeholderData, newSupport: number) => {
    if (newSupport === stakeholder.metrics.support) {
      removeChange(stakeholder.contact.id);
    } else {
      addChange({
        contactId: stakeholder.contact.id,
        contactName: `${stakeholder.contact.first_name} ${stakeholder.contact.last_name}`,
        originalMetrics: stakeholder.metrics,
        newMetrics: { support: newSupport },
        action: newSupport > stakeholder.metrics.support ? 'convert' : 'neutralize',
        description: `Alterar suporte de ${stakeholder.metrics.support} para ${newSupport}`,
      });
    }
  };

  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName, scenarioDescription);
      setSaveDialogOpen(false);
      setScenarioName('');
      setScenarioDescription('');
    }
  };

  if (stakeholders.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FlaskConical className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Sem stakeholders</h3>
          <p className="text-muted-foreground text-sm">
            Adicione contatos para simular cenários de conversão.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Simulador de Cenários
            </CardTitle>
            <div className="flex items-center gap-2">
              {changes.length > 0 && (
                <Badge variant="secondary">
                  {changes.length} alteração{changes.length !== 1 ? 'ões' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Teste estratégias de conversão antes de executá-las. Simule mudanças no suporte dos stakeholders e veja o impacto no balanço de poder.
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('convert_blockers')}
                    className="text-xs"
                  >
                    <UserX className="w-3 h-3 mr-1" />
                    Neutralizar Blockers
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simular conversão de todos os bloqueadores para neutros</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('boost_champions')}
                    className="text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Fortalecer Champions
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simular fortalecimento de apoiadores para champions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset('convert_neutrals')}
                    className="text-xs"
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    Converter Neutros
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simular conversão de todos os neutros para apoiadores</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {changes.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearChanges}
                className="text-xs text-destructive"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Cenários Salvos</p>
              <div className="flex flex-wrap gap-2">
                {savedScenarios.map(scenario => (
                  <div key={scenario.id} className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadScenario(scenario)}
                      className="text-xs"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {scenario.name}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteScenario(scenario.id)}
                      className="h-7 w-7"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {changes.length > 0 && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full">
                  <Save className="w-3 h-3 mr-1" />
                  Salvar Cenário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salvar Cenário</DialogTitle>
                  <DialogDescription>
                    Dê um nome ao cenário para referência futura.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Ex: Conversão Q1 2024"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição (opcional)</label>
                    <Textarea
                      value={scenarioDescription}
                      onChange={(e) => setScenarioDescription(e.target.value)}
                      placeholder="Descreva a estratégia..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveScenario}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Stakeholder List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Stakeholders ({stakeholders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {stakeholders.map(stakeholder => (
              <StakeholderSelector
                key={stakeholder.contact.id}
                stakeholder={stakeholder}
                isSelected={selectedId === stakeholder.contact.id}
                currentChange={changes.find(c => c.contactId === stakeholder.contact.id)}
                onSelect={() => setSelectedId(
                  selectedId === stakeholder.contact.id ? null : stakeholder.contact.id
                )}
                onChangeSupport={(support) => handleChangeSupport(stakeholder, support)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Result */}
      {simulationResult && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            Resultado da Simulação
          </h3>
          <SimulationResultPanel result={simulationResult} />
        </div>
      )}
    </div>
  );
}
