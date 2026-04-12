import { useState } from 'react';
import { MessageSquare, Clock, Calendar, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCommunicationPreferences } from '@/hooks/useCommunicationPreferences';

interface Props {
  contactId: string;
}

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'meeting', label: 'Reunião' },
];

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(CHANNELS.map(c => [c.value, c.label]));

const DAYS = [
  { value: 'monday', label: 'Seg' },
  { value: 'tuesday', label: 'Ter' },
  { value: 'wednesday', label: 'Qua' },
  { value: 'thursday', label: 'Qui' },
  { value: 'friday', label: 'Sex' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
];

const DAY_LABELS: Record<string, string> = Object.fromEntries(DAYS.map(d => [d.value, d.label]));

const FREQUENCIES = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
];

const FREQUENCY_LABELS: Record<string, string> = Object.fromEntries(FREQUENCIES.map(f => [f.value, f.label]));

export function CommunicationPreferencesCard({ contactId }: Props) {
  const { prefs, loading, upsert } = useCommunicationPreferences(contactId);
  const [editing, setEditing] = useState(false);

  const [channel, setChannel] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [avoidDays, setAvoidDays] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const startEditing = () => {
    setChannel(prefs?.preferred_channel || 'email');
    setFrequency(prefs?.contact_frequency || '');
    setTimeStart(prefs?.preferred_time_start || '');
    setTimeEnd(prefs?.preferred_time_end || '');
    setPreferredDays(prefs?.preferred_days || []);
    setAvoidDays(prefs?.avoid_days || []);
    setNotes(prefs?.notes || '');
    setEditing(true);
  };

  const handleSave = () => {
    upsert({
      preferred_channel: channel,
      contact_frequency: frequency || null,
      preferred_time_start: timeStart || null,
      preferred_time_end: timeEnd || null,
      preferred_days: preferredDays.length ? preferredDays : null,
      avoid_days: avoidDays.length ? avoidDays : null,
      notes: notes || null,
    });
    setEditing(false);
  };

  const toggleDay = (day: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(day) ? list.filter(d => d !== day) : [...list, day]);
  };

  if (loading) return null;

  const responseRates = prefs?.response_rate_by_channel as Record<string, number> | null;

  if (editing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Preferências de Comunicação
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditing(false)}>
                <X className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary" onClick={handleSave}>
                <Save className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Canal Preferido</label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Frequência</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Horário Início</label>
              <Input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Horário Fim</label>
              <Input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Dias Preferidos</label>
            <div className="flex gap-1 flex-wrap mt-1">
              {DAYS.map(d => (
                <Badge
                  key={d.value}
                  variant={preferredDays.includes(d.value) ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => toggleDay(d.value, preferredDays, setPreferredDays)}
                >
                  {d.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Dias para Evitar</label>
            <div className="flex gap-1 flex-wrap mt-1">
              {DAYS.map(d => (
                <Badge
                  key={d.value}
                  variant={avoidDays.includes(d.value) ? 'destructive' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => toggleDay(d.value, avoidDays, setAvoidDays)}
                >
                  {d.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Observações</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[50px] text-xs" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prefs) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Preferências de Comunicação
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={startEditing}>
              <Edit2 className="h-3 w-3" /> Definir
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Nenhuma preferência definida.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Preferências de Comunicação
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={startEditing}>
            <Edit2 className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-xs text-muted-foreground">Canal Preferido</p>
            <p className="font-medium text-sm text-foreground">
              {CHANNEL_LABELS[prefs.preferred_channel] || prefs.preferred_channel}
            </p>
          </div>
          {prefs.contact_frequency && (
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Frequência</p>
              <p className="font-medium text-sm text-foreground">
                {FREQUENCY_LABELS[prefs.contact_frequency] || prefs.contact_frequency}
              </p>
            </div>
          )}
        </div>

        {prefs.preferred_time_start && prefs.preferred_time_end && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Horário:</span>
            <span className="text-foreground">{prefs.preferred_time_start} - {prefs.preferred_time_end}</span>
          </div>
        )}

        {prefs.preferred_days && prefs.preferred_days.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {prefs.preferred_days.map(d => (
              <Badge key={d} variant="secondary" className="text-xs">
                {DAY_LABELS[d] || d}
              </Badge>
            ))}
          </div>
        )}

        {prefs.avoid_days && prefs.avoid_days.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Evitar:</span>
            {prefs.avoid_days.map(d => (
              <Badge key={d} variant="outline" className="text-xs text-destructive">
                {DAY_LABELS[d] || d}
              </Badge>
            ))}
          </div>
        )}

        {responseRates && Object.keys(responseRates).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Taxa de Resposta por Canal</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(responseRates).map(([ch, rate]) => (
                <div key={ch} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                  <span className="text-muted-foreground">{CHANNEL_LABELS[ch] || ch}</span>
                  <span className="font-medium text-foreground">{Math.round(rate * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {prefs.notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2">{prefs.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
