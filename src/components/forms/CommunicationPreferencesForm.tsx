import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageSquare, Phone, Mail, Clock, Calendar, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const formSchema = z.object({
  preferredChannel: z.string().min(1, 'Selecione um canal'),
  preferredDays: z.array(z.string()).optional(),
  preferredTimeStart: z.string().optional(),
  preferredTimeEnd: z.string().optional(),
  contactFrequency: z.string().optional(),
  avoidDays: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CommunicationPreferencesFormProps {
  contactId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const channels = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'email', label: 'E-mail', icon: Mail },
];

const frequencies = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
];

const weekDays = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export function CommunicationPreferencesForm({ contactId, onSuccess, trigger }: CommunicationPreferencesFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredChannel: 'whatsapp',
      preferredDays: [],
      preferredTimeStart: '09:00',
      preferredTimeEnd: '18:00',
      contactFrequency: 'weekly',
      avoidDays: [],
      notes: '',
    },
  });

  // Load existing preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || !open) return;

      const { data } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        form.reset({
          preferredChannel: data.preferred_channel,
          preferredDays: data.preferred_days || [],
          preferredTimeStart: data.preferred_time_start?.slice(0, 5) || '09:00',
          preferredTimeEnd: data.preferred_time_end?.slice(0, 5) || '18:00',
          contactFrequency: data.contact_frequency || 'weekly',
          avoidDays: data.avoid_days || [],
          notes: data.notes || '',
        });
      }
    };

    loadPreferences();
  }, [user, contactId, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        contact_id: contactId,
        preferred_channel: data.preferredChannel,
        preferred_days: data.preferredDays || [],
        preferred_time_start: data.preferredTimeStart || null,
        preferred_time_end: data.preferredTimeEnd || null,
        contact_frequency: data.contactFrequency || null,
        avoid_days: data.avoidDays || [],
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (existingId) {
        ({ error } = await supabase
          .from('communication_preferences')
          .update(payload)
          .eq('id', existingId));
      } else {
        ({ error } = await supabase
          .from('communication_preferences')
          .insert(payload));
      }

      if (error) throw error;

      toast.success('Preferências salvas com sucesso!');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Preferências
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Preferências de Comunicação
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferredChannel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal Preferido *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {channels.map(channel => (
                        <SelectItem key={channel.value} value={channel.value}>
                          <div className="flex items-center gap-2">
                            <channel.icon className="w-4 h-4" />
                            {channel.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência de Contato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencies.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredTimeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Início</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="time" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTimeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Fim</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="time" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredDays"
              render={() => (
                <FormItem>
                  <FormLabel>Dias Preferidos</FormLabel>
                  <FormDescription>Selecione os melhores dias para contato</FormDescription>
                  <div className="grid grid-cols-4 gap-2">
                    {weekDays.map(day => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="preferredDays"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.value]);
                                  } else {
                                    field.onChange(current.filter(d => d !== day.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal cursor-pointer">
                              {day.label.slice(0, 3)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avoidDays"
              render={() => (
                <FormItem>
                  <FormLabel>Dias a Evitar</FormLabel>
                  <FormDescription>Dias em que o cliente não quer ser contatado</FormDescription>
                  <div className="grid grid-cols-4 gap-2">
                    {weekDays.map(day => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="avoidDays"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.value]);
                                  } else {
                                    field.onChange(current.filter(d => d !== day.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal cursor-pointer">
                              {day.label.slice(0, 3)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Prefere ligações rápidas, não gosta de emails longos..."
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
