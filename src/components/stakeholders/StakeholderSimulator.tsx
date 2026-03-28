import { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Save,
  UserX,
  Minus,
  Sparkles,
  FolderOpen,
  X,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useStakeholderSimulator } from '@/hooks/useStakeholderSimulator';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { StakeholderSelector } from './StakeholderSelector';
import { SimulationResultPanel } from './SimulationResultPanel';

interface StakeholderSimulatorProps {
  stakeholders: StakeholderData[];
  className?: string;
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
                      aria-label="Excluir"
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
