import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, TrendingUp, DollarSign, Target, Trophy, Search } from 'lucide-react';
import { useDeals, PIPELINE_STAGES } from '@/hooks/useDeals';
import { PipelineColumn } from '@/components/pipeline/PipelineColumn';
import { CreateDealDialog } from '@/components/pipeline/CreateDealDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MainLayout from '@/components/layout/MainLayout';
import type { Deal } from '@/hooks/useDeals';

const Pipeline = () => {
  const { deals, isLoading, moveDeal, deleteDeal } = useDeals();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string>('');
  const [search, setSearch] = useState('');

  const filteredDeals = useMemo(() => {
    if (!search.trim()) return deals;
    const q = search.toLowerCase();
    return deals.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.contact?.first_name?.toLowerCase().includes(q) ||
      d.contact?.last_name?.toLowerCase().includes(q) ||
      d.company?.name?.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach(s => { map[s.id] = []; });
    filteredDeals.forEach(d => {
      if (map[d.stage]) map[d.stage].push(d);
      else map['lead'].push(d);
    });
    return map;
  }, [filteredDeals]);

  // Summary metrics
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.value || 0), 0);
  const weightedPipeline = activeDeals.reduce((s, d) => s + (d.value || 0) * ((d.probability || 0) / 100), 0);
  const wonDeals = deals.filter(d => d.stage === 'won');
  const wonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const winRate = deals.length > 0
    ? Math.round((wonDeals.length / deals.filter(d => d.stage === 'won' || d.stage === 'lost').length) * 100) || 0
    : 0;

  const handleDrop = (targetStage: string) => {
    if (draggedDealId && targetStage) {
      moveDeal.mutate({ id: draggedDealId, stage: targetStage });
    }
    setDraggedDealId(null);
    setDragOverStage('');
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setCreateOpen(true);
  };

  const handleDeleteDeal = (id: string) => {
    deleteDeal.mutate(id);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 px-6 pt-6 pb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pipeline de Vendas</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas oportunidades arrastando entre estágios</p>
            </div>
            <Button onClick={() => { setEditingDeal(null); setCreateOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Deal
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Total</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {totalPipeline.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Ponderado</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {weightedPipeline.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ganhos</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {wonValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-bold text-foreground">{winRate}%</p>
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="font-mono">
              {activeDeals.length} ativos
            </Badge>
          </div>
        </motion.div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex gap-4 px-6 pb-6 overflow-x-auto">
            {PIPELINE_STAGES.filter(s => s.id !== 'won' && s.id !== 'lost').map(s => (
              <div key={s.id} className="min-w-[280px] space-y-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto px-6 pb-6">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map(stage => (
                <PipelineColumn
                  key={stage.id}
                  stageId={stage.id}
                  deals={dealsByStage[stage.id] || []}
                  onDragStart={setDraggedDealId}
                  onDragEnd={() => { setDraggedDealId(null); setDragOverStage(''); }}
                  onDrop={handleDrop}
                  isDragOver={dragOverStage === stage.id}
                  onDragOver={setDragOverStage}
                  onEditDeal={handleEditDeal}
                  onDeleteDeal={handleDeleteDeal}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateDealDialog
        open={createOpen}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) setEditingDeal(null); }}
        editingDeal={editingDeal}
      />
    </MainLayout>
  );
};

export default Pipeline;
