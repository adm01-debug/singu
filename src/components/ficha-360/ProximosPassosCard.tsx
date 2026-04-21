import { memo, useEffect, useState } from 'react';
import {
  ListChecks,
  Sparkles,
  Mail,
  MessageCircle,
  Phone,
  Linkedin,
  Calendar,
  Copy,
  Plus,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import type { ProximoPasso, ProximoPassoChannel, ProximoPassoPriority } from '@/lib/proximosPassos';
import type { BestTimeHint } from '@/lib/proximoPassoDefaults';
import { ProximoPassoQuickForm } from './ProximoPassoQuickForm';

interface Props {
  contactId: string;
  contactName: string;
  passos: ProximoPasso[];
  bestTime?: BestTimeHint | null;
}

const channelIcon: Record<ProximoPassoChannel, typeof Mail> = {
  whatsapp: MessageCircle,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  linkedin: Linkedin,
};

const priorityMeta: Record<ProximoPassoPriority, { label: string; className: string }> = {
  alta: {
    label: 'Alta',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  media: {
    label: 'Média',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const urgencyToClass = (u?: string) => {
  const v = (u || '').toLowerCase();
  if (v === 'high') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (v === 'low') return 'bg-muted text-muted-foreground border-border';
  return 'bg-warning/10 text-warning border-warning/30';
};

function ProximosPassosCardComponent({ contactId, contactName, passos, bestTime }: Props) {
  const { nextAction, isGenerating, generate } = useNextBestAction(contactId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());

  // Limpa badges "criada" após 4s
  useEffect(() => {
    if (createdIds.size === 0) return;
    const timer = setTimeout(() => setCreatedIds(new Set()), 4000);
    return () => clearTimeout(timer);
  }, [createdIds]);

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Script copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleCreated = (passoId: string) => {
    setExpandedId(null);
    setCreatedIds((prev) => {
      const next = new Set(prev);
      next.add(passoId);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          Próximos Passos
          {passos.length > 0 && (
            <Badge variant="outline" className="text-xs font-normal">
              {passos.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bloco IA */}
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="rounded-full bg-primary/10 p-1.5 mt-0.5 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                {nextAction ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-sm">{nextAction.action}</p>
                      <Badge variant="outline" className={cn('text-[10px] capitalize', urgencyToClass(nextAction.urgency))}>
                        {nextAction.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{nextAction.reason}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm">Sugestão de IA</p>
                    <p className="text-xs text-muted-foreground">
                      Gere uma próxima ação personalizada para {contactName.split(' ')[0]}.
                    </p>
                  </>
                )}
              </div>
            </div>
            {!nextAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generate()}
                disabled={isGenerating}
                className="shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Gerar com IA
              </Button>
            )}
          </div>
        </div>

        {/* Lista local */}
        {passos.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Sem ações sugeridas no momento. Registre uma interação para gerar novas recomendações.
          </div>
        ) : (
          <ul className="space-y-2">
            {passos.map((p) => {
              const Icon = channelIcon[p.channel] ?? ListChecks;
              const pm = priorityMeta[p.priority];
              const isExpanded = expandedId === p.id;
              const wasCreated = createdIds.has(p.id);
              return (
                <li
                  key={p.id}
                  className="rounded-md border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-1.5 mt-0.5 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-medium text-sm">{p.title}</p>
                        <Badge variant="outline" className={cn('text-[10px]', pm.className)}>
                          {pm.label}
                        </Badge>
                        {wasCreated && (
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            Tarefa criada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.detail}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 italic">{p.reason}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Button
                          size="xs"
                          variant={isExpanded ? 'default' : 'outline'}
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          aria-expanded={isExpanded}
                        >
                          <Plus className="h-3 w-3" />
                          Criar tarefa
                          <ChevronDown
                            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </Button>
                        {p.scriptHint && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleCopy(p.scriptHint)}
                          >
                            <Copy className="h-3 w-3" />
                            Copiar script
                          </Button>
                        )}
                      </div>

                      {isExpanded && (
                        <ProximoPassoQuickForm
                          passo={p}
                          bestTime={bestTime}
                          contactId={contactId}
                          onCreated={() => handleCreated(p.id)}
                          onCancel={() => setExpandedId(null)}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export const ProximosPassosCard = memo(ProximosPassosCardComponent);
