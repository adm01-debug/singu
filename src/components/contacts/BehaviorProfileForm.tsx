import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactBehavior, DISCProfile, PreferredChannel, FormalityLevel, DISC_LABELS } from '@/types';
import { Save, X } from 'lucide-react';

interface BehaviorProfileFormProps {
  behavior?: ContactBehavior | null;
  onSave: (behavior: ContactBehavior) => void;
  onCancel: () => void;
}

const defaultBehavior: ContactBehavior = {
  discProfile: null,
  discConfidence: 50,
  preferredChannel: 'email',
  formalityLevel: 3,
  decisionCriteria: [],
  needsApproval: false,
  decisionPower: 5,
  supportLevel: 5,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: [],
  competitorsUsed: [],
};

export function BehaviorProfileForm({ behavior, onSave, onCancel }: BehaviorProfileFormProps) {
  const [formData, setFormData] = useState<ContactBehavior>(behavior || defaultBehavior);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formalityLabels: Record<FormalityLevel, string> = {
    1: 'Muito Informal',
    2: 'Informal',
    3: 'Neutro',
    4: 'Formal',
    5: 'Muito Formal',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-semibold">Perfil Comportamental</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="disc" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disc">DISC</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="decision">Decisão</TabsTrigger>
          <TabsTrigger value="context">Contexto</TabsTrigger>
        </TabsList>

        <TabsContent value="disc" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perfil DISC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Perfil Dominante</Label>
                <Select
                  value={formData.discProfile || ''}
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, discProfile: (value || null) as DISCProfile }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil DISC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">{DISC_LABELS.D.name} - {DISC_LABELS.D.description}</SelectItem>
                    <SelectItem value="I">{DISC_LABELS.I.name} - {DISC_LABELS.I.description}</SelectItem>
                    <SelectItem value="S">{DISC_LABELS.S.name} - {DISC_LABELS.S.description}</SelectItem>
                    <SelectItem value="C">{DISC_LABELS.C.name} - {DISC_LABELS.C.description}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Confiança da Análise</Label>
                  <span className="text-sm text-muted-foreground">{formData.discConfidence}%</span>
                </div>
                <Slider
                  value={[formData.discConfidence]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, discConfidence: value }))}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas sobre DISC</Label>
                <Textarea
                  value={formData.discNotes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, discNotes: e.target.value }))}
                  placeholder="Observações sobre o perfil comportamental..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferências de Comunicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Canal Preferido</Label>
                  <Select
                    value={formData.preferredChannel}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, preferredChannel: value as PreferredChannel }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="call">Telefone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="video">Videoconferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Nível de Formalidade</Label>
                    <span className="text-sm text-muted-foreground">{formalityLabels[formData.formalityLevel]}</span>
                  </div>
                  <Slider
                    value={[formData.formalityLevel]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, formalityLevel: value as FormalityLevel }))}
                    max={5}
                    min={1}
                    step={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Melhor Horário para Contato</Label>
                <Input
                  value={formData.bestContactWindow || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bestContactWindow: e.target.value }))}
                  placeholder="Ex: Segunda a Sexta, 9h-11h"
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo Médio de Resposta (horas)</Label>
                <Input
                  type="number"
                  value={formData.avgResponseTimeHours || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, avgResponseTimeHours: parseInt(e.target.value) || undefined }))}
                  placeholder="Ex: 24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tomada de Decisão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Poder de Decisão</Label>
                    <span className="text-sm text-muted-foreground">{formData.decisionPower}/10</span>
                  </div>
                  <Slider
                    value={[formData.decisionPower]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, decisionPower: value }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Nível de Suporte</Label>
                    <span className="text-sm text-muted-foreground">{formData.supportLevel}/10</span>
                  </div>
                  <Slider
                    value={[formData.supportLevel]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, supportLevel: value }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.needsApproval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needsApproval: checked }))}
                />
                <Label>Precisa de Aprovação de Terceiros</Label>
              </div>

              <div className="space-y-2">
                <Label>Autoridade de Orçamento</Label>
                <Input
                  value={formData.budgetAuthority || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetAuthority: e.target.value }))}
                  placeholder="Ex: Até R$ 50.000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexto e Motivações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Motivação Principal</Label>
                <Input
                  value={formData.primaryMotivation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryMotivation: e.target.value }))}
                  placeholder="O que motiva este contato..."
                />
              </div>

              <div className="space-y-2">
                <Label>Principal Medo/Preocupação</Label>
                <Input
                  value={formData.primaryFear || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryFear: e.target.value }))}
                  placeholder="Qual o principal receio..."
                />
              </div>

              <div className="space-y-2">
                <Label>Objetivos Profissionais</Label>
                <Textarea
                  value={formData.professionalGoals || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, professionalGoals: e.target.value }))}
                  placeholder="Objetivos de carreira..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Pressão Atual</Label>
                <Input
                  value={formData.currentPressure || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPressure: e.target.value }))}
                  placeholder="Pressões ou desafios atuais..."
                />
              </div>

              <div className="space-y-2">
                <Label>Melhor Momento para Abordagem</Label>
                <Input
                  value={formData.bestTimeToApproach || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bestTimeToApproach: e.target.value }))}
                  placeholder="Ex: Início do trimestre, após fechamento..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notas Sazonais</Label>
                <Textarea
                  value={formData.seasonalNotes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, seasonalNotes: e.target.value }))}
                  placeholder="Padrões sazonais, períodos de férias, etc..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

export default BehaviorProfileForm;
