import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, UserCircle, Palmtree } from 'lucide-react';
import { useSalesTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from '@/hooks/useSalesTeam';
import { ROLE_LABELS, ROLE_COLORS } from '@/types/leadRouting';
import type { SalesTeamMember, SalesRole } from '@/types/leadRouting';
import { Skeleton } from '@/components/ui/skeleton';

function MemberForm({
  initial,
  onSave,
  isPending,
}: {
  initial?: Partial<SalesTeamMember>;
  onSave: (data: Partial<SalesTeamMember>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState<SalesRole>(initial?.role ?? 'sdr');
  const [weight, setWeight] = useState(initial?.weight ?? 5);
  const [maxDay, setMaxDay] = useState(initial?.max_leads_day ?? 10);
  const [maxTotal, setMaxTotal] = useState(initial?.max_leads_total ?? 50);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do vendedor" /></div>
        <div><Label>E-mail</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as SalesRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Cap Diário</Label><Input type="number" min={1} value={maxDay} onChange={(e) => setMaxDay(Number(e.target.value))} /></div>
        <div><Label>Cap Total</Label><Input type="number" min={1} value={maxTotal} onChange={(e) => setMaxTotal(Number(e.target.value))} /></div>
      </div>
      <div>
        <Label>Peso no Rodízio: {weight}</Label>
        <Slider min={1} max={10} step={1} value={[weight]} onValueChange={([v]) => setWeight(v)} className="mt-2" />
      </div>
      <Button onClick={() => onSave({ name, email, role, weight, max_leads_day: maxDay, max_leads_total: maxTotal })} disabled={!name.trim() || isPending} className="w-full">
        {initial?.id ? 'Atualizar' : 'Adicionar'}
      </Button>
    </div>
  );
}

export default function SalesTeamTab() {
  const { data: members = [], isLoading } = useSalesTeam();
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  }

  const isOnVacation = (m: SalesTeamMember) => {
    if (!m.vacation_start || !m.vacation_end) return false;
    const now = new Date();
    return now >= new Date(m.vacation_start) && now <= new Date(m.vacation_end);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{members.length} membros na equipe</p>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Membro</DialogTitle></DialogHeader>
            <MemberForm
              onSave={(data) => { createMember.mutate(data); setShowForm(false); }}
              isPending={createMember.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {members.map((m) => (
          <Card key={m.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      <Badge variant="outline" className={ROLE_COLORS[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                      {!m.is_active && <Badge variant="secondary">Inativo</Badge>}
                      {isOnVacation(m) && <Badge variant="secondary"><Palmtree className="h-3 w-3 mr-1" />Férias</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p>Peso: <span className="font-medium">{m.weight}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {m.leads_today}/{m.max_leads_day} hoje · {m.current_lead_count}/{m.max_leads_total} total
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={editingId === m.id} onOpenChange={(o) => setEditingId(o ? m.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar {m.name}</DialogTitle></DialogHeader>
                        <MemberForm
                          initial={m}
                          onSave={(data) => { updateMember.mutate({ id: m.id, ...data }); setEditingId(null); }}
                          isPending={updateMember.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => deleteMember.mutate(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum membro cadastrado. Adicione vendedores SDR e Closers para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
