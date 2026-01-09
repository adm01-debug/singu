import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Users, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Lightbulb,
  Heart,
  Briefcase,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DISCSelector, DISCChart } from '@/components/ui/disc-badge';
import { cn } from '@/lib/utils';
import { 
  ContactBehavior, 
  DISCProfile, 
  DecisionRole, 
  DecisionSpeed, 
  CareerStage,
  PreferredChannel,
  MessageStyle,
  FormalityLevel,
  DecisionCriteria,
  DECISION_ROLE_LABELS,
  DECISION_SPEED_LABELS,
  CAREER_STAGE_LABELS,
  DECISION_CRITERIA_LABELS
} from '@/types';

interface BehaviorProfileFormProps {
  behavior: ContactBehavior;
  onSave: (behavior: ContactBehavior) => void;
  onCancel: () => void;
}

const steps = [
  { id: 'disc', title: 'Perfil DISC', icon: Brain, description: 'Identifique o perfil comportamental' },
  { id: 'motivation', title: 'Motivações', icon: Lightbulb, description: 'O que move essa pessoa' },
  { id: 'communication', title: 'Comunicação', icon: MessageSquare, description: 'Como se comunicar melhor' },
  { id: 'decision', title: 'Decisão', icon: Target, description: 'Como decide e prioriza' },
  { id: 'influence', title: 'Influência', icon: Users, description: 'Poder e rede de influência' },
  { id: 'context', title: 'Contexto', icon: Briefcase, description: 'Situação atual e timing' },
];

export function BehaviorProfileForm({ behavior, onSave, onCancel }: BehaviorProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ContactBehavior>(behavior);

  const updateField = <K extends keyof ContactBehavior>(field: K, value: ContactBehavior[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCriteria = (criteria: DecisionCriteria) => {
    const current = formData.decisionCriteria || [];
    if (current.includes(criteria)) {
      updateField('decisionCriteria', current.filter(c => c !== criteria));
    } else {
      updateField('decisionCriteria', [...current, criteria]);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSave(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'disc':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Perfil DISC Principal</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione o perfil comportamental predominante baseado nas interações observadas.
              </p>
              <DISCSelector 
                value={formData.discProfile} 
                onChange={(v) => updateField('discProfile', v)} 
              />
            </div>

            {formData.discProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label className="mb-2 block">Nível de Confiança: {formData.discConfidence}%</Label>
                  <Slider
                    value={[formData.discConfidence]}
                    onValueChange={([v]) => updateField('discConfidence', v)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Incerto</span>
                    <span>Moderado</span>
                    <span>Muito confiante</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="discNotes" className="mb-2 block">Observações sobre o perfil</Label>
                  <Textarea
                    id="discNotes"
                    value={formData.discNotes || ''}
                    onChange={(e) => updateField('discNotes', e.target.value)}
                    placeholder="Ex: Demonstra impaciência em reuniões longas, prefere ir direto ao ponto..."
                    rows={3}
                  />
                </div>

                <div className="pt-4">
                  <Label className="mb-3 block">Visualização do Perfil</Label>
                  <DISCChart profile={formData.discProfile} />
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'motivation':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="primaryMotivation" className="mb-2 block font-semibold">
                Motivação Principal
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                O que essa pessoa busca? O que a faz levantar da cama toda manhã?
              </p>
              <Textarea
                id="primaryMotivation"
                value={formData.primaryMotivation || ''}
                onChange={(e) => updateField('primaryMotivation', e.target.value)}
                placeholder="Ex: Ser reconhecido como líder inovador, crescer na carreira, deixar um legado..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="primaryFear" className="mb-2 block font-semibold">
                Medo/Preocupação Principal
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                O que essa pessoa quer evitar a todo custo?
              </p>
              <Textarea
                id="primaryFear"
                value={formData.primaryFear || ''}
                onChange={(e) => updateField('primaryFear', e.target.value)}
                placeholder="Ex: Perder o emprego, ficar para trás da concorrência, cometer erros..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="careerStage" className="mb-2 block">Estágio de Carreira</Label>
                <Select 
                  value={formData.careerStage || ''} 
                  onValueChange={(v) => updateField('careerStage', v as CareerStage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAREER_STAGE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="currentPressure" className="mb-2 block font-semibold">
                Pressão Atual
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Que pressões essa pessoa está enfrentando agora?
              </p>
              <Textarea
                id="currentPressure"
                value={formData.currentPressure || ''}
                onChange={(e) => updateField('currentPressure', e.target.value)}
                placeholder="Ex: Conselho cobrando resultados, metas agressivas, reestruturação..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="professionalGoals" className="mb-2 block font-semibold">
                Objetivos Profissionais
              </Label>
              <Textarea
                id="professionalGoals"
                value={formData.professionalGoals || ''}
                onChange={(e) => updateField('professionalGoals', e.target.value)}
                placeholder="Ex: Tornar-se diretor em 2 anos, expandir internacionalmente..."
                rows={2}
              />
            </div>
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block font-semibold">Canal Preferido</Label>
              <div className="grid grid-cols-5 gap-2">
                {(['whatsapp', 'call', 'email', 'meeting', 'video'] as PreferredChannel[]).map((channel) => (
                  <Button
                    key={channel}
                    type="button"
                    variant={formData.preferredChannel === channel ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => updateField('preferredChannel', channel)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs capitalize">
                      {channel === 'whatsapp' ? 'WhatsApp' : 
                       channel === 'call' ? 'Ligação' :
                       channel === 'email' ? 'Email' :
                       channel === 'meeting' ? 'Presencial' : 'Vídeo'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block font-semibold">Estilo de Mensagem</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['audio', 'short_text', 'long_text', 'documents'] as MessageStyle[]).map((style) => (
                  <Button
                    key={style}
                    type="button"
                    variant={formData.messageStyle === style ? 'default' : 'outline'}
                    className="text-xs h-auto py-2"
                    onClick={() => updateField('messageStyle', style)}
                  >
                    {style === 'audio' ? 'Áudios' : 
                     style === 'short_text' ? 'Texto curto' :
                     style === 'long_text' ? 'Texto longo' : 'Docs'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Nível de Formalidade: {formData.formalityLevel}
              </Label>
              <Slider
                value={[formData.formalityLevel]}
                onValueChange={([v]) => updateField('formalityLevel', v as FormalityLevel)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Muito informal</span>
                <span>Neutro</span>
                <span>Muito formal</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="avgResponseTime" className="mb-2 block">
                  Tempo médio de resposta (horas)
                </Label>
                <Input
                  id="avgResponseTime"
                  type="number"
                  value={formData.avgResponseTimeHours || ''}
                  onChange={(e) => updateField('avgResponseTimeHours', Number(e.target.value))}
                  placeholder="Ex: 4"
                />
              </div>
              <div>
                <Label htmlFor="bestContactWindow" className="mb-2 block">
                  Melhor horário para contato
                </Label>
                <Input
                  id="bestContactWindow"
                  value={formData.bestContactWindow || ''}
                  onChange={(e) => updateField('bestContactWindow', e.target.value)}
                  placeholder="Ex: 09:00 - 11:00"
                />
              </div>
            </div>
          </div>
        );

      case 'decision':
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block font-semibold">Velocidade de Decisão</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(DECISION_SPEED_LABELS) as [DecisionSpeed, string][]).map(([speed, label]) => (
                  <Button
                    key={speed}
                    type="button"
                    variant={formData.decisionSpeed === speed ? 'default' : 'outline'}
                    className="text-sm"
                    onClick={() => updateField('decisionSpeed', speed)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block font-semibold">
                Critérios de Decisão (em ordem de prioridade)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione os critérios mais importantes para essa pessoa
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(DECISION_CRITERIA_LABELS) as [DecisionCriteria, string][]).map(([criteria, label]) => {
                  const isSelected = formData.decisionCriteria?.includes(criteria);
                  const index = formData.decisionCriteria?.indexOf(criteria) ?? -1;
                  
                  return (
                    <Button
                      key={criteria}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      className="relative"
                      onClick={() => toggleCriteria(criteria)}
                    >
                      {isSelected && index >= 0 && (
                        <span className="absolute -top-2 -left-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                      )}
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <Label className="font-semibold">Precisa de aprovação?</Label>
                <p className="text-sm text-muted-foreground">
                  Essa pessoa precisa de aprovação de alguém para decidir?
                </p>
              </div>
              <Switch
                checked={formData.needsApproval}
                onCheckedChange={(v) => updateField('needsApproval', v)}
              />
            </div>

            <div>
              <Label htmlFor="budgetAuthority" className="mb-2 block">
                Autoridade de Orçamento
              </Label>
              <Input
                id="budgetAuthority"
                value={formData.budgetAuthority || ''}
                onChange={(e) => updateField('budgetAuthority', e.target.value)}
                placeholder="Ex: Até R$ 50.000 sem aprovação"
              />
            </div>
          </div>
        );

      case 'influence':
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block font-semibold">Papel no Processo de Decisão</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(DECISION_ROLE_LABELS) as [DecisionRole, string][]).map(([role, label]) => (
                  <Button
                    key={role}
                    type="button"
                    variant={formData.decisionRole === role ? 'default' : 'outline'}
                    className="text-sm justify-start"
                    onClick={() => updateField('decisionRole', role)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Poder de Decisão: {formData.decisionPower}/10
              </Label>
              <Slider
                value={[formData.decisionPower]}
                onValueChange={([v]) => updateField('decisionPower', v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Pouco poder</span>
                <span>Poder total</span>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Nível de Apoio ao nosso projeto: {formData.supportLevel}/10
              </Label>
              <Slider
                value={[formData.supportLevel]}
                onValueChange={([v]) => updateField('supportLevel', v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Bloqueador</span>
                <span>Neutro</span>
                <span>Defensor</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Dica:</strong> Na próxima versão, você poderá vincular outros contatos 
                para mapear quem influencia e é influenciado por essa pessoa.
              </p>
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentChallenges" className="mb-2 block font-semibold">
                Desafios Atuais
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Quais problemas essa pessoa/empresa está enfrentando?
              </p>
              <Textarea
                id="currentChallenges"
                value={formData.currentChallenges?.join('\n') || ''}
                onChange={(e) => updateField('currentChallenges', e.target.value.split('\n').filter(Boolean))}
                placeholder="Um desafio por linha:&#10;Escalar operações&#10;Reduzir custos&#10;Atrair talentos"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="competitorsUsed" className="mb-2 block font-semibold">
                Concorrentes/Soluções Atuais
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Que soluções essa pessoa usa hoje ou já usou?
              </p>
              <Textarea
                id="competitorsUsed"
                value={formData.competitorsUsed?.join('\n') || ''}
                onChange={(e) => updateField('competitorsUsed', e.target.value.split('\n').filter(Boolean))}
                placeholder="Uma solução por linha:&#10;Salesforce&#10;Excel&#10;Sistema interno"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bestTimeToApproach" className="mb-2 block font-semibold">
                Melhor Momento para Abordar
              </Label>
              <Textarea
                id="bestTimeToApproach"
                value={formData.bestTimeToApproach || ''}
                onChange={(e) => updateField('bestTimeToApproach', e.target.value)}
                placeholder="Ex: Início do Q1 durante planejamento anual, após fechar grandes projetos..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="seasonalNotes" className="mb-2 block font-semibold">
                Notas de Sazonalidade
              </Label>
              <Textarea
                id="seasonalNotes"
                value={formData.seasonalNotes || ''}
                onChange={(e) => updateField('seasonalNotes', e.target.value)}
                placeholder="Ex: Evitar dezembro (férias), safra em março-junho (muito ocupado)..."
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Perfil Comportamental
        </CardTitle>
        <CardDescription>
          Preencha as informações para entender melhor como se relacionar com essa pessoa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-success bg-success text-white',
                      !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-full h-0.5 mx-2',
                      index < currentStep ? 'bg-success' : 'bg-muted'
                    )} style={{ width: '40px' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-semibold text-lg">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[400px]"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <div className="text-sm text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </div>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              <>
                Salvar
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
