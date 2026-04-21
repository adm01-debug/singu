import { memo, useMemo, useState } from 'react';
import { Loader2, Calendar as CalIcon, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useTasks';
import {
  computePassoDefaults,
  priorityToTaskPriority,
  type BestTimeHint,
} from '@/lib/proximoPassoDefaults';
import type {
  ProximoPasso,
  ProximoPassoChannel,
  ProximoPassoPriority,
} from '@/lib/proximosPassos';

interface Props {
  passo: ProximoPasso;
  bestTime?: BestTimeHint | null;
  contactId: string;
  onCreated: () => void;
  onCancel: () => void;
}

const CHANNEL_OPTIONS: Array<{ value: ProximoPassoChannel; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'call', label: 'Ligação' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const PRIORITY_OPTIONS: Array<{ value: ProximoPassoPriority; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function ProximoPassoQuickFormComponent({ passo, bestTime, contactId, onCreated, onCancel }: Props) {
  const createTask = useCreateTask();
  const defaults = useMemo(() => computePassoDefaults(passo, bestTime), [passo, bestTime]);

  const [date, setDate] = useState<string>(defaults.date);
  const [time, setTime] = useState<string>(defaults.time);
  const [channel, setChannel] = useState<ProximoPassoChannel>(defaults.channel);
  const [priority, setPriority] = useState<ProximoPassoPriority>(defaults.priority);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dueDateIso = useMemo(() => {
    const [y, m, d] = date.split('-').map((x) => parseInt(x, 10));
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    return dt.toISOString();
  }, [date, time]);

  const hint = useMemo(() => {
    const channelLabel = CHANNEL_OPTIONS.find((c) => c.value === defaults.channel)?.label ?? defaults.channel;
    const parts = [`Sugerido: ${channelLabel} em ${formatDateBr(defaults.date)} às ${defaults.time}`];
    if (defaults.bestTimeApplied) parts.push('baseado no melhor horário do contato');
    else if (defaults.bestDayApplied) parts.push('ajustado para o melhor dia');
    return parts.join(' • ');
  }, [defaults]);

  const handleSubmit = () => {
    if (!date || !time) {
      toast.error('Informe data e hora');
      return;
    }
    createTask.mutate(
      {
        title: passo.title,
        description: `${passo.reason}\n\n${passo.detail}`,
        contact_id: contactId,
        priority: priorityToTaskPriority(priority),
        task_type: channel,
        due_date: dueDateIso,
        status: 'pending',
      },
      {
        onSuccess: () => {
          toast.success(`Tarefa criada para ${formatDateBr(date)} às ${time}`);
          onCreated();
        },
      },
    );
  };

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`pp-date-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <CalIcon className="h-3 w-3" /> Data
          </Label>
          <Input
            id={`pp-date-${passo.id}`}
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pp-time-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Hora
          </Label>
          <Input
            id={`pp-time-${passo.id}`}
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Canal</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as ProximoPassoChannel)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as ProximoPassoPriority)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
        <span>{hint}</span>
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={createTask.isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={createTask.isPending}>
          {createTask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Confirmar
        </Button>
      </div>
    </div>
  );
}

export const ProximoPassoQuickForm = memo(ProximoPassoQuickFormComponent);
