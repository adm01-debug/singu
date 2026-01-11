import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  MessageSquare,
  Phone,
  Mail,
  Video,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useContactPreferences } from '@/hooks/useContactPreferences';
import { cn } from '@/lib/utils';

interface ContactPreferencesPanelProps {
  contactId: string;
  contactName: string;
  compact?: boolean;
  className?: string;
}

const channelIcons: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  video: Video,
  meeting: Users,
};

export function ContactPreferencesPanel({
  contactId,
  contactName,
  compact = false,
  className,
}: ContactPreferencesPanelProps) {
  const { preference, loading, savePreference, isGoodTimeToContact, constants } = useContactPreferences(contactId);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [formData, setFormData] = useState({
    preferred_channel: preference?.preferred_channel || 'whatsapp',
    preferred_days: preference?.preferred_days || [],
    preferred_times: preference?.preferred_times || [],
    avoid_days: preference?.avoid_days || [],
    avoid_times: preference?.avoid_times || [],
    restrictions: preference?.restrictions || '',
    personal_notes: preference?.personal_notes || '',
    communication_tips: preference?.communication_tips || '',
  });

  const contactStatus = isGoodTimeToContact();
  const ChannelIcon = channelIcons[preference?.preferred_channel || 'whatsapp'] || MessageSquare;

  const handleSave = async () => {
    await savePreference(formData);
    setIsEditing(false);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (loading) return null;

  // Quick view when not editing
  if (!isEditing) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Preferências de Contato
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="pt-0 space-y-4">
                {/* Contact Status Alert */}
                {contactStatus.reason && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    contactStatus.canContact
                      ? contactStatus.isIdeal
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                      : "bg-warning/10 text-warning"
                  )}>
                    {contactStatus.canContact ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {contactStatus.reason}
                  </div>
                )}

                {preference ? (
                  <>
                    {/* Preferred Channel */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ChannelIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Canal Preferido</p>
                        <p className="font-medium">
                          {constants.CHANNELS.find(c => c.value === preference.preferred_channel)?.label || 'WhatsApp'}
                        </p>
                      </div>
                    </div>

                    {/* Preferred Days */}
                    {preference.preferred_days.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Dias Preferidos</p>
                        <div className="flex flex-wrap gap-1">
                          {preference.preferred_days.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs bg-success/10 text-success">
                              {constants.DAYS_OF_WEEK.find(d => d.value === day)?.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avoided Days/Times */}
                    {(preference.avoid_days.length > 0 || preference.avoid_times.length > 0) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Evitar Contato</p>
                        <div className="flex flex-wrap gap-1">
                          {preference.avoid_days.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                              {constants.DAYS_OF_WEEK.find(d => d.value === day)?.label}
                            </Badge>
                          ))}
                          {preference.avoid_times.map(time => (
                            <Badge key={time} variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                              {constants.TIME_SLOTS.find(t => t.value === time)?.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restrictions */}
                    {preference.restrictions && (
                      <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <p className="text-xs font-medium text-warning mb-1">⚠️ Restrições</p>
                        <p className="text-sm">{preference.restrictions}</p>
                      </div>
                    )}

                    {/* Communication Tips */}
                    {preference.communication_tips && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-1">💡 Dicas</p>
                        <p className="text-sm">{preference.communication_tips}</p>
                      </div>
                    )}

                    {/* Personal Notes */}
                    {preference.personal_notes && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">📝 Notas</p>
                        <p className="text-sm">{preference.personal_notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Settings2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhuma preferência definida
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Editar Preferências - {contactName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preferred Channel */}
        <div className="space-y-2">
          <Label>Canal Preferido</Label>
          <div className="flex flex-wrap gap-2">
            {constants.CHANNELS.map(channel => {
              const Icon = channelIcons[channel.value] || MessageSquare;
              return (
                <Button
                  key={channel.value}
                  type="button"
                  variant={formData.preferred_channel === channel.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, preferred_channel: channel.value }))}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {channel.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Preferred Days */}
        <div className="space-y-2">
          <Label>Dias Preferidos</Label>
          <div className="flex flex-wrap gap-2">
            {constants.DAYS_OF_WEEK.map(day => (
              <label
                key={day.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                  formData.preferred_days.includes(day.value)
                    ? "border-success bg-success/10"
                    : "border-border hover:border-success/50"
                )}
              >
                <Checkbox
                  checked={formData.preferred_days.includes(day.value)}
                  onCheckedChange={() => setFormData(prev => ({
                    ...prev,
                    preferred_days: toggleArrayItem(prev.preferred_days, day.value)
                  }))}
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Avoid Days */}
        <div className="space-y-2">
          <Label>Evitar Dias</Label>
          <div className="flex flex-wrap gap-2">
            {constants.DAYS_OF_WEEK.map(day => (
              <label
                key={day.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                  formData.avoid_days.includes(day.value)
                    ? "border-destructive bg-destructive/10"
                    : "border-border hover:border-destructive/50"
                )}
              >
                <Checkbox
                  checked={formData.avoid_days.includes(day.value)}
                  onCheckedChange={() => setFormData(prev => ({
                    ...prev,
                    avoid_days: toggleArrayItem(prev.avoid_days, day.value)
                  }))}
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Avoid Times */}
        <div className="space-y-2">
          <Label>Evitar Horários</Label>
          <div className="flex flex-wrap gap-2">
            {constants.TIME_SLOTS.map(time => (
              <label
                key={time.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                  formData.avoid_times.includes(time.value)
                    ? "border-destructive bg-destructive/10"
                    : "border-border hover:border-destructive/50"
                )}
              >
                <Checkbox
                  checked={formData.avoid_times.includes(time.value)}
                  onCheckedChange={() => setFormData(prev => ({
                    ...prev,
                    avoid_times: toggleArrayItem(prev.avoid_times, time.value)
                  }))}
                />
                <span className="text-sm">{time.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Restrictions */}
        <div className="space-y-2">
          <Label>Restrições Importantes</Label>
          <Textarea
            placeholder="Ex: Não ligar no horário de almoço, evitar segundas-feiras..."
            value={formData.restrictions}
            onChange={(e) => setFormData(prev => ({ ...prev, restrictions: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Communication Tips */}
        <div className="space-y-2">
          <Label>Dicas de Comunicação</Label>
          <Textarea
            placeholder="Ex: Gosta de conversa informal antes de negócios, prefere mensagens curtas..."
            value={formData.communication_tips}
            onChange={(e) => setFormData(prev => ({ ...prev, communication_tips: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Personal Notes */}
        <div className="space-y-2">
          <Label>Notas Pessoais</Label>
          <Textarea
            placeholder="Ex: Tem 2 filhos, gosta de futebol, viajou para Portugal recentemente..."
            value={formData.personal_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, personal_notes: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
