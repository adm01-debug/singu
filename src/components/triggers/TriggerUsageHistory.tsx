import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  History,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Star,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTriggerHistory, TriggerUsageEntry, TriggerResult } from '@/hooks/useTriggerHistory';
import { MENTAL_TRIGGERS } from '@/types/triggers';

interface TriggerUsageHistoryProps {
  contactId: string;
  contactName?: string;
  className?: string;
  compact?: boolean;
}

const resultConfig: Record<TriggerResult, { label: string; icon: React.ElementType; color: string }> = {
  success: { label: 'Sucesso', icon: CheckCircle2, color: 'text-green-600 bg-green-100 border-green-200' },
  neutral: { label: 'Neutro', icon: MinusCircle, color: 'text-gray-600 bg-gray-100 border-gray-200' },
  failure: { label: 'Falhou', icon: XCircle, color: 'text-red-600 bg-red-100 border-red-200' },
  pending: { label: 'Pendente', icon: Clock, color: 'text-amber-600 bg-amber-100 border-amber-200' },
};

function HistoryEntry({
  entry,
  onUpdateResult,
  onUpdateRating,
  onDelete,
}: {
  entry: TriggerUsageEntry;
  onUpdateResult: (id: string, result: TriggerResult) => void;
  onUpdateRating: (id: string, rating: number) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(entry.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const trigger = MENTAL_TRIGGERS[entry.trigger_type];
  const resultInfo = resultConfig[entry.result];
  const ResultIcon = resultInfo.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${trigger?.color || 'bg-muted'} shrink-0`}>
            <span className="text-lg">{trigger?.icon || '🎯'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{trigger?.name || entry.trigger_type}</span>
              {entry.template_title && (
                <Badge variant="outline" className="text-xs truncate max-w-[150px]">
                  {entry.template_title}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(entry.used_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={entry.result}
            onValueChange={(value) => onUpdateResult(entry.id, value as TriggerResult)}
          >
            <SelectTrigger className={`h-7 w-auto gap-1 text-xs border ${resultInfo.color}`}>
              <ResultIcon className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(resultConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t space-y-3">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Efetividade:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onUpdateRating(entry.id, rating)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          (entry.effectiveness_rating || 0) >= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Context */}
              {entry.context && (
                <div>
                  <span className="text-sm text-muted-foreground">Contexto:</span>
                  <p className="text-sm mt-1">{entry.context}</p>
                </div>
              )}

              {/* Channel & Scenario */}
              <div className="flex gap-2 flex-wrap">
                {entry.channel && (
                  <Badge variant="secondary" className="text-xs">
                    Canal: {entry.channel}
                  </Badge>
                )}
                {entry.scenario && (
                  <Badge variant="secondary" className="text-xs">
                    Cenário: {entry.scenario}
                  </Badge>
                )}
              </div>

              {/* Notes */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 -ml-2"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {entry.notes ? 'Editar anotação' : 'Adicionar anotação'}
                </Button>
                {showNotes && (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre o resultado..."
                    className="mt-2 text-sm min-h-[60px]"
                    onBlur={() => {
                      if (notes !== entry.notes) {
                        // Would need to add updateNotes function
                      }
                    }}
                  />
                )}
                {entry.notes && !showNotes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">"{entry.notes}"</p>
                )}
              </div>

              {/* Delete */}
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1">
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover registro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O registro de uso do gatilho será permanentemente removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(entry.id)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatsPanel({ stats }: { stats: NonNullable<ReturnType<typeof useTriggerHistory>['stats']> }) {
  const mostUsedTrigger = stats.mostUsedTrigger ? MENTAL_TRIGGERS[stats.mostUsedTrigger.type] : null;
  const mostEffectiveTrigger = stats.mostEffectiveTrigger ? MENTAL_TRIGGERS[stats.mostEffectiveTrigger.type] : null;

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs">Total de Usos</span>
        </div>
        <p className="text-xl font-bold">{stats.totalUsages}</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs">Taxa de Sucesso</span>
        </div>
        <p className="text-xl font-bold text-green-600">{stats.successRate.toFixed(0)}%</p>
      </div>
      {mostUsedTrigger && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Mais Usado</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{mostUsedTrigger.icon}</span>
            <span className="font-medium text-sm">{mostUsedTrigger.name}</span>
          </div>
        </div>
      )}
      {mostEffectiveTrigger && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Mais Efetivo</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{mostEffectiveTrigger.icon}</span>
            <span className="font-medium text-sm">{mostEffectiveTrigger.name}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.mostEffectiveTrigger!.avgRating.toFixed(1)}★)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TriggerUsageHistory({ contactId, contactName, className, compact = false }: TriggerUsageHistoryProps) {
  const { history, loading, stats, updateUsage, deleteUsage } = useTriggerHistory(contactId);
  const [showAll, setShowAll] = useState(false);

  const handleUpdateResult = async (id: string, result: TriggerResult) => {
    const success = await updateUsage(id, { result });
    if (success) {
      toast.success('Resultado atualizado!');
    } else {
      toast.error('Erro ao atualizar resultado');
    }
  };

  const handleUpdateRating = async (id: string, rating: number) => {
    const success = await updateUsage(id, { effectiveness_rating: rating });
    if (success) {
      toast.success('Avaliação salva!');
    } else {
      toast.error('Erro ao salvar avaliação');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUsage(id);
    if (success) {
      toast.success('Registro removido');
    } else {
      toast.error('Erro ao remover registro');
    }
  };

  const displayedHistory = showAll ? history : history.slice(0, compact ? 3 : 5);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Gatilhos
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats && history.length > 0 && !compact && <StatsPanel stats={stats} />}

        {history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum gatilho utilizado ainda</p>
            <p className="text-xs mt-1">
              Use gatilhos e templates para começar a registrar o histórico
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedHistory.map((entry) => (
                <HistoryEntry
                  key={entry.id}
                  entry={entry}
                  onUpdateResult={handleUpdateResult}
                  onUpdateRating={handleUpdateRating}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>

            {history.length > (compact ? 3 : 5) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Mostrar menos' : `Ver todos (${history.length})`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
