import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask } from '@/hooks/useTasks';

export function CreateTaskDialog() {
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
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setTaskType('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nova Tarefa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Criar Nova Tarefa</DialogTitle></DialogHeader>
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
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Criar Tarefa
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
