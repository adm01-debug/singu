import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Zap } from 'lucide-react';
import { useRoutingRules, useCreateRoutingRule, useUpdateRoutingRule, useDeleteRoutingRule } from '@/hooks/useLeadRouting';
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

  return (
    <div className="space-y-4">
      <div><Label>Nome da Regra</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Distribuição SDR Brasil" /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a regra..." rows={2} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div>
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
        <div>
          <Label>Papel</Label>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'sdr' | 'closer' | 'any')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Prioridade</Label><Input type="number" min={1} value={priority} onChange={(e) => setPriority(Number(e.target.value))} /></div>
      </div>
      <Button onClick={() => onSave({ name, description, rule_type: ruleType, role_filter: roleFilter as 'sdr' | 'closer' | 'any', priority })} disabled={!name.trim() || isPending} className="w-full">
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

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rules.length} regras configuradas</p>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regra de Distribuição</DialogTitle></DialogHeader>
            <RuleForm onSave={(data) => { createRule.mutate(data); setShowForm(false); }} isPending={createRule.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rules.map((r, idx) => (
          <Card key={r.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">#{r.priority}</Badge>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="secondary">{RULE_TYPE_LABELS[r.rule_type]}</Badge>
                      {r.role_filter !== 'any' && <Badge variant="outline">{r.role_filter.toUpperCase()}</Badge>}
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) => updateRule.mutate({ id: r.id, is_active: v })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(r.id)}>
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
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhuma regra configurada. Crie regras para automatizar a distribuição de leads.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
