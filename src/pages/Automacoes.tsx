import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Zap, Power, Trash2, Edit2, History, 
  ChevronRight, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomationRules, TRIGGER_OPTIONS, ACTION_OPTIONS, type CreateRuleData, type AutomationAction, type AutomationCondition, type TriggerType, type ActionType } from '@/hooks/useAutomationRules';
import { AutomationTemplates } from '@/components/automation/AutomationTemplates';
import { ConditionBuilder } from '@/components/automation/ConditionBuilder';
import { ActionConfigForm } from '@/components/automation/ActionConfigForm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===================== RULE FORM =====================

function RuleFormDialog({ 
  open, onOpenChange, onSubmit, initialData 
}: { 
  open: boolean; 
  onOpenChange: (o: boolean) => void; 
  onSubmit: (data: CreateRuleData) => void;
  initialData?: CreateRuleData & { id?: string };
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [triggerType, setTriggerType] = useState<TriggerType>(initialData?.trigger_type ?? 'interaction_created');
  const [triggerConfig, setTriggerConfig] = useState<string>(
    initialData?.trigger_config ? JSON.stringify(initialData.trigger_config, null, 2) : '{}'
  );
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    initialData?.conditions ?? []
  );
  const [actions, setActions] = useState<AutomationAction[]>(
    initialData?.actions ?? [{ type: 'create_alert', config: { title: 'Alerta automático' } }]
  );

  // Reset form state when initialData changes (useState only initializes once)
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
      setTriggerType(initialData?.trigger_type ?? 'interaction_created');
      setTriggerConfig(initialData?.trigger_config ? JSON.stringify(initialData.trigger_config, null, 2) : '{}');
      setConditions(initialData?.conditions ?? []);
      setActions(initialData?.actions ?? [{ type: 'create_alert', config: { title: 'Alerta automático' } }]);
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    let parsedConfig = {};
    try { parsedConfig = JSON.parse(triggerConfig); } catch { /* keep empty */ }
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: triggerType,
      trigger_config: parsedConfig,
      conditions,
      actions,
    });
    onOpenChange(false);
  };

  const updateAction = (index: number, type: ActionType) => {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, type } : a));
  };

  const updateActionConfig = (index: number, config: Record<string, unknown>) => {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, config } : a));
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions(prev => [...prev, { type: 'create_alert', config: { title: '' } }]);
  };

  const triggerMeta = TRIGGER_OPTIONS.find(t => t.value === triggerType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {initialData?.id ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="rule-name">Nome da regra *</Label>
              <Input id="rule-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alertar quando score cair" />
            </div>
            <div>
              <Label htmlFor="rule-desc">Descrição</Label>
              <Textarea id="rule-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que esta automação faz..." rows={2} />
            </div>
          </div>

          <Separator />

          {/* Trigger */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">🎯 Quando (Trigger)</Label>
            <Select value={triggerType} onValueChange={v => setTriggerType(v as TriggerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {triggerMeta && (
              <p className="text-xs text-muted-foreground">{triggerMeta.description}</p>
            )}

            {/* Trigger Config for specific triggers */}
            {triggerType === 'no_contact_days' && (
              <div>
                <Label className="text-xs">Dias mínimos sem contato</Label>
                <Input 
                  type="number" className="text-xs h-8 w-32"
                  value={(() => { try { return JSON.parse(triggerConfig)?.min_days || ''; } catch { return ''; } })()}
                  onChange={e => setTriggerConfig(JSON.stringify({ min_days: Number(e.target.value) }))}
                  placeholder="14"
                />
              </div>
            )}
            {triggerType === 'score_changed' && (
              <div className="flex gap-2">
                <div>
                  <Label className="text-xs">Direção</Label>
                  <Select 
                    value={(() => { try { return JSON.parse(triggerConfig)?.direction || 'decrease'; } catch { return 'decrease'; } })()}
                    onValueChange={v => {
                      let cfg = {}; try { cfg = JSON.parse(triggerConfig); } catch {}
                      setTriggerConfig(JSON.stringify({ ...cfg, direction: v }));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Aumento</SelectItem>
                      <SelectItem value="decrease">Queda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Threshold</Label>
                  <Input 
                    type="number" className="text-xs h-8 w-24"
                    value={(() => { try { return JSON.parse(triggerConfig)?.threshold || ''; } catch { return ''; } })()}
                    onChange={e => {
                      let cfg = {}; try { cfg = JSON.parse(triggerConfig); } catch {}
                      setTriggerConfig(JSON.stringify({ ...cfg, threshold: Number(e.target.value) }));
                    }}
                    placeholder="10"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Visual Conditions */}
          <ConditionBuilder conditions={conditions} onChange={setConditions} />

          <Separator />

          {/* Actions with config forms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">⚡ Então (Ações)</Label>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="w-3 h-3 mr-1" /> Ação
              </Button>
            </div>
            
            {actions.map((action, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Select value={action.type} onValueChange={v => updateAction(i, v as ActionType)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          <span className="flex items-center gap-2">
                            <span>{a.icon}</span>
                            <span>{a.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAction(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <ActionConfigForm action={action} onChange={(cfg) => updateActionConfig(i, cfg)} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            <Zap className="w-4 h-4 mr-2" />
            {initialData?.id ? 'Salvar' : 'Criar Automação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN PAGE =====================

export default function Automacoes() {
  const { rules, logs, loading, createRule, updateRule, deleteRule, toggleRule, fetchLogs } = useAutomationRules();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<(CreateRuleData & { id: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logsRuleId, setLogsRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('rules');

  const handleCreate = async (data: CreateRuleData) => {
    await createRule(data);
  };

  const handleUseTemplate = (data: CreateRuleData) => {
    // Open edit dialog pre-filled with template data (no id = create mode)
    setEditingRule({ ...data, id: '' });
    setActiveTab('rules');
  };

  const handleEdit = async (data: CreateRuleData) => {
    if (editingRule?.id) {
      await updateRule(editingRule.id, data);
    } else {
      // Creating from template (no id)
      await createRule(data);
    }
    setEditingRule(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRule(deleteId);
    setDeleteId(null);
  };

  const handleViewLogs = (ruleId: string) => {
    setLogsRuleId(ruleId);
    fetchLogs(ruleId);
  };

  const activeCount = rules.filter(r => r.is_active).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.execution_count, 0);

  return (
    <AppLayout title="Automações">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Automações & Workflows
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Crie regras automáticas: "Se X acontecer → Faça Y"
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Automação
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Total de Regras</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Power className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <History className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExecutions}</p>
                <p className="text-xs text-muted-foreground">Execuções</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules">Minhas Regras</TabsTrigger>
            <TabsTrigger value="templates">📦 Templates Prontos</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <AutomationTemplates onUseTemplate={handleUseTemplate} />
          </TabsContent>

          <TabsContent value="rules" className="mt-4">

        {/* Rules List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Automatize tarefas repetitivas. Crie regras como "Quando não houver contato por 30 dias → Criar alerta"
              </p>
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {rules.map((rule, index) => {
                const trigger = TRIGGER_OPTIONS.find(t => t.value === rule.trigger_type);
                const actionLabels = rule.actions.map(a => ACTION_OPTIONS.find(o => o.value === a.type)?.label ?? a.type);

                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={!rule.is_active ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Toggle */}
                          <div className="pt-1">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => toggleRule(rule.id)}
                              aria-label={`${rule.is_active ? 'Desativar' : 'Ativar'} ${rule.name}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{rule.name}</h3>
                              {rule.last_error && (
                                <Badge variant="destructive" className="text-[10px]">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Erro
                                </Badge>
                              )}
                            </div>
                            
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{rule.description}</p>
                            )}

                            {/* Trigger → Actions flow */}
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <Badge variant="secondary" className="gap-1">
                                {trigger?.icon} {trigger?.label}
                              </Badge>
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              {actionLabels.map((label, i) => (
                                <Badge key={i} variant="outline" className="gap-1">
                                  {ACTION_OPTIONS.find(a => a.label === label)?.icon} {label}
                                </Badge>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{rule.execution_count} execuções</span>
                              {rule.last_executed_at && (
                                <span>Última: {formatDistanceToNow(new Date(rule.last_executed_at), { addSuffix: true, locale: ptBR })}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => handleViewLogs(rule.id)}
                              aria-label="Ver histórico"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => setEditingRule({
                                id: rule.id,
                                name: rule.name,
                                description: rule.description,
                                trigger_type: rule.trigger_type,
                                trigger_config: rule.trigger_config,
                                conditions: rule.conditions,
                                actions: rule.actions,
                              })}
                              aria-label="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteId(rule.id)}
                              aria-label="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <RuleFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />

        {/* Edit Dialog */}
        {editingRule && (
          <RuleFormDialog 
            open={!!editingRule} 
            onOpenChange={o => { if (!o) setEditingRule(null); }} 
            onSubmit={handleEdit}
            initialData={editingRule}
          />
        )}

        {/* Delete Confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Automação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todo o histórico de execuções desta regra também será removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logs Dialog */}
        <Dialog open={!!logsRuleId} onOpenChange={o => { if (!o) setLogsRuleId(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Execuções
              </DialogTitle>
            </DialogHeader>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma execução registrada.</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    {log.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {log.actions_executed.map(a => ACTION_OPTIONS.find(o => o.value === a.type)?.label).join(', ')}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-destructive truncate">{log.error_message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
