import { useState } from 'react';
import { Plus, GripVertical, Trash2, Mail, MessageSquare, Phone, Linkedin, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateSequenceData } from '@/hooks/useSequences';

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'sms', label: 'SMS', icon: MessageCircle },
] as const;

type StepDraft = {
  channel: string;
  delay_days: number;
  delay_hours: number;
  subject: string;
  message_template: string;
  notes: string;
};

const emptyStep = (): StepDraft => ({
  channel: 'email',
  delay_days: 1,
  delay_hours: 0,
  subject: '',
  message_template: '',
  notes: '',
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSequenceData) => Promise<void>;
  loading?: boolean;
}

export function SequenceFormDialog({ open, onOpenChange, onSubmit, loading }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pauseOnReply, setPauseOnReply] = useState(true);
  const [pauseOnMeeting, setPauseOnMeeting] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);

  const addStep = () => setSteps(prev => [...prev, emptyStep()]);
  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));
  const updateStep = (idx: number, field: keyof StepDraft, value: string | number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async () => {
    if (!name.trim() || steps.length === 0) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      pause_on_reply: pauseOnReply,
      pause_on_meeting: pauseOnMeeting,
      steps: steps.map(s => ({
        ...s,
        step_order: 0,
        channel: s.channel as 'email' | 'whatsapp' | 'call' | 'linkedin' | 'sms',
        subject: s.subject || null,
        message_template: s.message_template || null,
        notes: s.notes || null,
      })),
    });
    setName('');
    setDescription('');
    setSteps([emptyStep()]);
    onOpenChange(false);
  };

  const ChannelIcon = (ch: string) => {
    const found = CHANNELS.find(c => c.value === ch);
    return found ? found.icon : Mail;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Sequência Multi-canal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome da Sequência</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding Novos Leads" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição..." />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={pauseOnReply} onCheckedChange={setPauseOnReply} />
              Pausar ao receber resposta
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={pauseOnMeeting} onCheckedChange={setPauseOnMeeting} />
              Pausar ao agendar reunião
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Etapas ({steps.length})</Label>
              <Button variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Etapa
              </Button>
            </div>

            {steps.map((step, idx) => {
              const Icon = ChannelIcon(step.channel);
              return (
                <div key={idx} className="border border-border/50 rounded-lg p-3 space-y-2 bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-bold text-primary w-5">{idx + 1}</span>

                    <Select value={step.channel} onValueChange={v => updateStep(idx, 'channel', v)}>
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className="flex items-center gap-1.5">
                              <c.icon className="h-3.5 w-3.5" /> {c.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-xs text-muted-foreground">após</span>
                    <Input
                      type="number" min={0} value={step.delay_days}
                      onChange={e => updateStep(idx, 'delay_days', Number(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                    <span className="text-xs text-muted-foreground">dias</span>
                    <Input
                      type="number" min={0} max={23} value={step.delay_hours}
                      onChange={e => updateStep(idx, 'delay_hours', Number(e.target.value))}
                      className="h-8 w-14 text-center"
                    />
                    <span className="text-xs text-muted-foreground">h</span>

                    {steps.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeStep(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {(step.channel === 'email') && (
                    <Input
                      value={step.subject} onChange={e => updateStep(idx, 'subject', e.target.value)}
                      placeholder="Assunto do email" className="h-8 text-xs"
                    />
                  )}

                  <Textarea
                    value={step.message_template}
                    onChange={e => updateStep(idx, 'message_template', e.target.value)}
                    placeholder="Template da mensagem... Use {{nome}}, {{empresa}} como variáveis"
                    rows={2} className="text-xs resize-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || steps.length === 0}>
            {loading ? 'Criando...' : 'Criar Sequência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
