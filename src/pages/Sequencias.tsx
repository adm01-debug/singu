import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { ListFilter, Play, Users, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSequences } from '@/hooks/useSequences';
import { useSequenceProcessor } from '@/hooks/useSequenceProcessor';
import { SequenceCard } from '@/components/sequences/SequenceCard';
import { SequenceFormDialog } from '@/components/sequences/SequenceFormDialog';
import { SequenceMetricsCard } from '@/components/sequences/SequenceMetricsCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Sequencias() {
  usePageTitle('Sequências');
  const { sequences, loading, createSequence, toggleStatus, deleteSequence, creating } = useSequences();
  const processor = useSequenceProcessor();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = sequences.filter(s => s.status === 'active').length;
  const totalEnrolled = sequences.reduce((sum, s) => sum + s.total_enrolled, 0);
  const totalReplied = sequences.reduce((sum, s) => sum + s.total_replied, 0);

  const stats = [
    { icon: ListFilter, value: sequences.length, label: 'Sequências', cls: 'bg-primary/10', iconCls: 'text-primary' },
    { icon: Play, value: activeCount, label: 'Ativas', cls: 'bg-success/10', iconCls: 'text-success' },
    { icon: Users, value: totalEnrolled, label: 'Inscritos', cls: 'bg-warning/10', iconCls: 'text-warning' },
    { icon: Zap, value: totalReplied, label: 'Respostas', cls: 'bg-accent/10', iconCls: 'text-accent-foreground' },
  ];

  return (
    <AppLayout title="Sequências">
      <SEOHead title="Sequências Multi-canal" description="Cadências automáticas: Email → WhatsApp → Ligação com pause-on-reply" />
      <Header
        title="Sequências Multi-canal"
        subtitle="Cadências automáticas com etapas progressivas e pause-on-reply"
        hideBack showAddButton addButtonLabel="Nova Sequência"
        onAddClick={() => setFormOpen(true)}
      />

      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${s.cls} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.iconCls}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 h-40 animate-pulse bg-secondary/30" /></Card>
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <ListFilter className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma sequência criada.</p>
              <p className="text-xs text-muted-foreground">
                Crie uma sequência para automatizar o contato com seus leads em múltiplos canais.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button
                size="sm" variant="outline"
                onClick={() => processor.mutate()}
                disabled={processor.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${processor.isPending ? 'animate-spin' : ''}`} />
                Rodar processador agora
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sequences.map(seq => (
                <div key={seq.id} className="space-y-2">
                  <SequenceCard
                    sequence={seq}
                    onToggle={(id, status) => toggleStatus({ id, status })}
                    onDelete={setDeleteId}
                    onClick={() => {}}
                  />
                  {seq.status === 'active' && <SequenceMetricsCard sequenceId={seq.id} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SequenceFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={async (d) => { await createSequence(d); }} loading={creating} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sequência?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os enrollments serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteSequence(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
