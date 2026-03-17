import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals, PIPELINE_STAGES, Deal } from '@/hooks/useDeals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Nome obrigatório'),
  value: z.coerce.number().min(0).default(0),
  stage: z.string().default('lead'),
  priority: z.string().default('medium'),
  contact_id: z.string().optional().nullable(),
  company_id: z.string().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDeal?: Deal | null;
}

export function CreateDealDialog({ open, onOpenChange, editingDeal }: CreateDealDialogProps) {
  const { user } = useAuth();
  const { createDeal, updateDeal } = useDeals();
  const isEditing = !!editingDeal;

  const { data: contacts } = useQuery({
    queryKey: ['contacts-select'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('id, first_name, last_name').order('first_name');
      return data || [];
    },
    enabled: open && !!user,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-select'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').order('name');
      return data || [];
    },
    enabled: open && !!user,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingDeal ? {
      title: editingDeal.title,
      value: editingDeal.value,
      stage: editingDeal.stage,
      priority: editingDeal.priority,
      contact_id: editingDeal.contact_id,
      company_id: editingDeal.company_id,
      expected_close_date: editingDeal.expected_close_date,
      notes: editingDeal.notes,
    } : {
      title: '',
      value: 0,
      stage: 'lead',
      priority: 'medium',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing) {
      await updateDeal.mutateAsync({ id: editingDeal.id, ...data } as any);
    } else {
      await createDeal.mutateAsync(data as any);
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = createDeal.isPending || updateDeal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Deal' : 'Novo Deal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Nome do Deal *</Label>
            <Input id="title" placeholder="Ex: Projeto de consultoria" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="value">Valor (R$)</Label>
              <Input id="value" type="number" step="0.01" placeholder="0.00" {...form.register('value')} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.watch('priority')} onValueChange={(v) => form.setValue('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estágio</Label>
              <Select value={form.watch('stage')} onValueChange={(v) => form.setValue('stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.filter(s => s.id !== 'won' && s.id !== 'lost').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expected_close_date">Previsão Fechamento</Label>
              <Input id="expected_close_date" type="date" {...form.register('expected_close_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contato</Label>
              <Select value={form.watch('contact_id') || ''} onValueChange={(v) => form.setValue('contact_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {contacts?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empresa</Label>
              <Select value={form.watch('company_id') || ''} onValueChange={(v) => form.setValue('company_id', v || null)}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {companies?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" placeholder="Detalhes do deal..." {...form.register('notes')} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
