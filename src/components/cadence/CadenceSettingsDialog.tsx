import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useContactCadence } from '@/hooks/useContactCadence';
import { CalendarClock, Clock, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CadenceSettingsDialogProps {
  contactId: string;
  contactName: string;
  trigger?: React.ReactNode;
  onSave?: () => void;
}

export function CadenceSettingsDialog({
  contactId,
  contactName,
  trigger,
  onSave,
}: CadenceSettingsDialogProps) {
  const { setCadence, cadences, presets } = useContactCadence();
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('medium');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');

  // Load existing cadence
  useEffect(() => {
    const existing = cadences.find(c => c.contact_id === contactId);
    if (existing) {
      // Find matching preset
      const matchingPreset = Object.entries(presets).find(
        ([_, p]) => p.days === existing.cadence_days
      );
      if (matchingPreset) {
        setSelectedPreset(matchingPreset[0]);
      }
      setPriority(existing.priority as 'high' | 'medium' | 'low');
      setNotes(existing.notes || '');
    }
  }, [cadences, contactId, presets]);

  const handleSave = async () => {
    const preset = presets[selectedPreset as keyof typeof presets];
    await setCadence(contactId, preset.days, priority, notes);
    setOpen(false);
    onSave?.();
  };

  const presetIcons: Record<string, React.ReactNode> = {
    vip: <Star className="w-4 h-4 text-warning" />,
    high: <Zap className="w-4 h-4 text-destructive" />,
    medium: <CalendarClock className="w-4 h-4 text-primary" />,
    low: <Clock className="w-4 h-4 text-muted-foreground" />,
    minimal: <Clock className="w-4 h-4 text-muted-foreground/50" />,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CalendarClock className="w-4 h-4 mr-2" />
            Definir Cadência
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Cadência de Contato
          </DialogTitle>
          <DialogDescription>
            Defina a frequência ideal de contato com <strong>{contactName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label>Frequência de Contato</Label>
            <RadioGroup
              value={selectedPreset}
              onValueChange={setSelectedPreset}
              className="grid grid-cols-1 gap-2"
            >
              {Object.entries(presets).map(([key, preset]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedPreset === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedPreset(key)}
                >
                  <RadioGroupItem value={key} id={key} />
                  <div className="flex-1 flex items-center gap-2">
                    {presetIcons[key]}
                    <span className="font-medium">{preset.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {preset.days} dias
                  </Badge>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p)}
                  className={cn(
                    priority === p && p === 'high' && 'bg-destructive hover:bg-destructive/90',
                    priority === p && p === 'low' && 'bg-muted-foreground hover:bg-muted-foreground/90'
                  )}
                >
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Preferência por contato às segundas-feiras..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Cadência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
