import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Zap, AlertTriangle } from 'lucide-react';
import {
  useRoutingRules, useCreateRoutingRule,
  useUpdateRoutingRule, useDeleteRoutingRule,
} from '@/hooks/useLeadRouting';
import { RULE_TYPE_LABELS } from '@/types/leadRouting';
import type { LeadRoutingRule, RoutingRuleType } from '@/types/leadRouting';
import { Skeleton } from '@/components/ui/skeleton';

function RuleForm({
  initial,
  onSave,
  isPending,
}: {
  initial?: Partial<LeadRoutingRule>;
  onSave: (data: Partial<LeadRoutingRule>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [ruleType, setRuleType] = useState<RoutingRuleType>(initial?.rule_type ?? 'round_robin');
  const [roleFilter, setRoleFilter] = useState<'sdr' | 'closer' | 'any'>(initial?.role_filter ?? 'any');
  const [priority, setPriority] = useState(initial?.priority ?? 1);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      rule_type: ruleType,
      role_filter: roleFilter,
      priority,
    });
  }, [name, description, ruleType, roleFilter, priority, onSave]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome da Regra *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Distribuição SDR Brasil" />
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva quando esta regra deve ser aplicada..." rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={ruleType} onValueChange={(v) => setRuleType(v as RoutingRuleType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Papel Alvo</Label>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'sdr' | 'closer' | 'any')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Input type="number" min={1} max={100} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">Menor = executa primeiro</p>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={!name.trim() || isPending} className="w-full">
        {initial?.id ? 'Atualizar Regra' : 'Criar Regra'}
      </Button>
    </div>
  );
}

export default function RoutingRulesTab() {
  const { data: rules = [], isLoading } = useRoutingRules();
  const createRule = useCreateRoutingRule();
  const updateRule = useUpdateRoutingRule();
  const deleteRule = useDeleteRoutingRule();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const ruleToDelete = deleteId ? rules.find((r) => r.id === deleteId) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rules.length} regra{rules.length !== 1 ? 's' : ''} configurada{rules.length !== 1 ? 's' : ''}
        </p>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regra de Distribuição</DialogTitle></DialogHeader>
            <RuleForm
              onSave={(data) => { createRule.mutate(data); setShowForm(false); }}
              isPending={createRule.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rules.map((r) => (
          <Card key={r.id} className={`border ${!r.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Badge variant="outline" className="text-xs shrink-0">#{r.priority}</Badge>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="secondary">{RULE_TYPE_LABELS[r.rule_type]}</Badge>
                      {r.role_filter !== 'any' && (
                        <Badge variant="outline">{r.role_filter.toUpperCase()}</Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{r.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => updateRule.mutate({ id: r.id, is_active: v })}
                    aria-label={`${r.is_active ? 'Desativar' : 'Ativar'} regra ${r.name}`}
                  />
                  <Dialog open={editingId === r.id} onOpenChange={(o) => setEditingId(o ? r.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Regra</DialogTitle></DialogHeader>
                      <RuleForm
                        initial={r}
                        onSave={(data) => { updateRule.mutate({ id: r.id, ...data }); setEditingId(null); }}
                        isPending={updateRule.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma regra configurada</p>
              <p className="text-xs mt-1">Crie regras para automatizar a distribuição de leads entre SDRs e Closers.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover a regra <strong>{ruleToDelete?.name}</strong>?
            Novas distribuições não usarão mais esta regra.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteId) { deleteRule.mutate(deleteId); setDeleteId(null); } }}
              disabled={deleteRule.isPending}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
