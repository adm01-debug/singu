import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Calendar, Gift, Briefcase, Plane, Heart, Trophy, Star, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const formSchema = z.object({
  eventType: z.string().min(1, 'Selecione o tipo de evento'),
  title: z.string().min(1, 'Título é obrigatório'),
  eventDate: z.date({ required_error: 'Data é obrigatória' }),
  description: z.string().optional(),
  recurring: z.boolean().default(false),
  reminderDaysBefore: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LifeEventFormProps {
  contactId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const eventTypes = [
  { value: 'birthday', label: 'Aniversário', icon: Gift, color: 'text-pink-500' },
  { value: 'anniversary', label: 'Aniversário de Empresa', icon: Briefcase, color: 'text-blue-500' },
  { value: 'promotion', label: 'Promoção/Mudança de Cargo', icon: Trophy, color: 'text-yellow-500' },
  { value: 'travel', label: 'Viagem/Férias', icon: Plane, color: 'text-green-500' },
  { value: 'family', label: 'Evento Familiar', icon: Heart, color: 'text-red-500' },
  { value: 'contract_renewal', label: 'Renovação de Contrato', icon: Calendar, color: 'text-purple-500' },
  { value: 'achievement', label: 'Conquista/Marco', icon: Star, color: 'text-orange-500' },
  { value: 'other', label: 'Outro', icon: Bell, color: 'text-gray-500' },
];

export function LifeEventForm({ contactId, onSuccess, trigger }: LifeEventFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: '',
      title: '',
      eventDate: undefined,
      description: '',
      recurring: false,
      reminderDaysBefore: '7',
    },
  });

  const selectedEventType = form.watch('eventType');
  const selectedEvent = eventTypes.find(e => e.value === selectedEventType);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('life_events').insert({
        user_id: user.id,
        contact_id: contactId,
        event_type: data.eventType,
        title: data.title,
        event_date: data.eventDate.toISOString(),
        description: data.description || null,
        recurring: data.recurring,
        reminder_days_before: data.reminderDaysBefore ? parseInt(data.reminderDaysBefore) : 7,
      });

      if (error) throw error;

      toast.success('Evento registrado com sucesso!');
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Error saving event:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill title based on event type
  const handleEventTypeChange = (value: string) => {
    form.setValue('eventType', value);
    const event = eventTypes.find(e => e.value === value);
    if (event && !form.getValues('title')) {
      form.setValue('title', event.label);
    }
    // Set recurring based on event type
    if (value === 'birthday' || value === 'anniversary') {
      form.setValue('recurring', true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Adicionar Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedEvent ? (
              <>
                <selectedEvent.icon className={cn("w-5 h-5", selectedEvent.color)} />
                Registrar Evento
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-primary" />
                Registrar Evento Importante
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento *</FormLabel>
                  <Select onValueChange={handleEventTypeChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map(event => (
                        <SelectItem key={event.value} value={event.value}>
                          <div className="flex items-center gap-2">
                            <event.icon className={cn("w-4 h-4", event.color)} />
                            {event.label}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aniversário de 40 anos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes sobre o evento..."
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Recorrente</FormLabel>
                      <FormDescription className="text-xs">
                        Repete todo ano
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminderDaysBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lembrar antes (dias)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" min="0" max="30" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
