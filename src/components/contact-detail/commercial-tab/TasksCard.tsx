import { useContactTasks } from '@/hooks/useContactTasks';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Circle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-green-500',
  urgent: 'text-red-700',
};

export function TasksCard({ contactId }: Props) {
  const { data: tasks, isLoading, error, refetch } = useContactTasks(contactId);

  const pending = tasks?.filter(t => t.status !== 'completed' && t.status !== 'done') || [];
  const completed = tasks?.filter(t => t.status === 'completed' || t.status === 'done') || [];

  return (
    <ExternalDataCard
      title="Tarefas"
      icon={<CheckSquare className="h-4 w-4" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      isEmpty={!tasks?.length}
      emptyMessage="Nenhuma tarefa vinculada"
      badge={pending.length ? `${pending.length} pendente(s)` : tasks?.length ? `${tasks.length}` : undefined}
    >
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {pending.map(task => (
          <div key={task.id} className="flex items-start gap-2 p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
            <Circle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${priorityColors[task.priority || 'medium'] || 'text-muted-foreground'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(task.due_date), 'dd/MM/yy')}
                  </span>
                )}
                {task.task_type && (
                  <Badge variant="outline" className="text-[9px]">{task.task_type}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        {completed.length > 0 && (
          <details className="mt-1">
            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
              {completed.length} tarefa(s) concluída(s)
            </summary>
            <div className="mt-1 space-y-1">
              {completed.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-1.5 rounded-md opacity-60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <p className="text-[10px] line-through truncate">{task.title}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </ExternalDataCard>
  );
}
