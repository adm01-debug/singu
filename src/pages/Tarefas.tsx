import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, Plus, Filter,
  Circle, CheckCircle2, Calendar, ArrowUpDown, Search,
  ChevronRight, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAllTasks, useOverdueTasks, useCreateTask, useCompleteTask, Task } from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const priorityConfig: Record<string, { label: string; color: string; badgeClass: string; order: number }> = {
  urgent: { label: 'Urgente', color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30', order: 0 },
  high: { label: 'Alta', color: 'text-red-500', badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30', order: 1 },
  medium: { label: 'Média', color: 'text-warning', badgeClass: 'bg-warning/10 text-warning border-warning/30', order: 2 },
  low: { label: 'Baixa', color: 'text-success', badgeClass: 'bg-success/10 text-success border-success/30', order: 3 },
};

const statusConfig: Record<string, { label: string; icon: typeof Circle }> = {
  pending: { label: 'Pendente', icon: Circle },
  in_progress: { label: 'Em andamento', icon: Clock },
  completed: { label: 'Concluída', icon: CheckCircle2 },
  done: { label: 'Concluída', icon: CheckCircle2 },
  overdue: { label: 'Atrasada', icon: AlertTriangle },
};

function getDueDateLabel(dateStr?: string): { label: string; className: string } | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return { label: 'Hoje', className: 'text-warning font-medium' };
    if (isTomorrow(date)) return { label: 'Amanhã', className: 'text-info' };
    if (isPast(date)) return { label: `Atrasada (${format(date, 'dd/MM')})`, className: 'text-destructive font-medium' };
    return { label: format(date, "dd/MM/yy", { locale: ptBR }), className: 'text-muted-foreground' };
  } catch {
    return null;
  }
}

function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const navigate = useNavigate();
  const priority = priorityConfig[task.priority || 'medium'] || priorityConfig.medium;
  const dueInfo = getDueDateLabel(task.due_date);
  const isCompleted = task.status === 'completed' || task.status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      layout
    >
      <Card className={cn(
        'transition-all hover:shadow-md border-l-4',
        isCompleted ? 'opacity-60 border-l-success/50' : 'border-l-transparent',
        task.priority === 'urgent' && !isCompleted && 'border-l-destructive',
        task.priority === 'high' && !isCompleted && 'border-l-red-500',
        task.priority === 'medium' && !isCompleted && 'border-l-warning',
        task.priority === 'low' && !isCompleted && 'border-l-success',
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => !isCompleted && onComplete(task.id)}
              disabled={isCompleted}
              className="mt-0.5 shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Circle className={cn('h-5 w-5 hover:text-success transition-colors', priority.color)} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn('text-sm font-medium', isCompleted && 'line-through text-muted-foreground')}>
                  {task.title}
                </h4>
                <Badge variant="outline" className={cn('text-[10px] shrink-0', priority.badgeClass)}>
                  {priority.label}
                </Badge>
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {dueInfo && (
                  <span className={cn('text-[11px] flex items-center gap-1', dueInfo.className)}>
                    <Calendar className="h-3 w-3" />{dueInfo.label}
                  </span>
                )}
                {task.task_type && (
                  <Badge variant="outline" className="text-[10px]">{task.task_type}</Badge>
                )}
                {task.contact_name && (
                  <button
                    onClick={() => task.contact_id && navigate(`/contatos/${task.contact_id}`)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    {task.contact_name}<ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {task.company_name && (
                  <button
                    onClick={() => task.company_id && navigate(`/empresas/${task.company_id}`)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    {task.company_name}<ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateTaskDialog() {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskType, setTaskType] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      task_type: taskType || undefined,
      status: 'pending',
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTaskType('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título *</Label>
            <Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Ligar para cliente X" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Descrição</Label>
            <Textarea id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes opcionais..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Data Limite</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">📞 Ligação</SelectItem>
                <SelectItem value="email">📧 E-mail</SelectItem>
                <SelectItem value="meeting">📅 Reunião</SelectItem>
                <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
                <SelectItem value="proposal">📝 Proposta</SelectItem>
                <SelectItem value="other">📌 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Criar Tarefa
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Tarefas() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');

  const { data: allTasks, isLoading } = useAllTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const completeTask = useCompleteTask();

  const categorizedTasks = useMemo(() => {
    const tasks = allTasks || [];
    const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done');
    return { pending, completed, overdue: overdueTasks || [] };
  }, [allTasks, overdueTasks]);

  const filteredTasks = useMemo(() => {
    let tasks: Task[];
    switch (activeTab) {
      case 'overdue': tasks = categorizedTasks.overdue; break;
      case 'completed': tasks = categorizedTasks.completed; break;
      default: tasks = categorizedTasks.pending;
    }

    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      tasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.contact_name?.toLowerCase().includes(term) ||
        t.company_name?.toLowerCase().includes(term)
      );
    }

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) -
               (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
      }
      if (sortBy === 'due_date') {
        const da = a.due_date || '9999';
        const db = b.due_date || '9999';
        return da.localeCompare(db);
      }
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [activeTab, categorizedTasks, searchTerm, sortBy]);

  const stats = {
    pending: categorizedTasks.pending.length,
    overdue: categorizedTasks.overdue.length,
    completed: categorizedTasks.completed.length,
    total: (allTasks || []).length,
  };

  return (
    <>
      <Helmet>
        <title>Tarefas & Lembretes | SINGU CRM</title>
        <meta name="description" content="Gerencie suas tarefas, follow-ups e lembretes de contatos" />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-primary" />
              Tarefas & Lembretes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas atividades pendentes e acompanhe seus follow-ups
            </p>
          </div>
          <CreateTaskDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Pendentes</p>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Atrasadas</p>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : stats.overdue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Concluídas</p>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? '-' : stats.total}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Data limite</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="created_at">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />Pendentes
              {stats.pending > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />Atrasadas
              {stats.overdue > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{stats.overdue}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />Concluídas
            </TabsTrigger>
          </TabsList>

          {['pending', 'overdue', 'completed'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
              ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Nenhuma tarefa encontrada para esta busca' :
                       tab === 'pending' ? 'Nenhuma tarefa pendente — tudo em dia! 🎉' :
                       tab === 'overdue' ? 'Nenhuma tarefa atrasada — ótimo trabalho! ✨' :
                       'Nenhuma tarefa concluída ainda'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={id => completeTask.mutate(id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
