import { memo, useState } from 'react';
import { Check, MessageSquareReply, MessageSquare, VolumeX, PhoneOff, SkipForward, Loader2, ArrowLeft, History, Inbox } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useRegisterPassoFeedback,
  useProximoPassoFeedbacks,
  type PassoOutcome,
} from '@/hooks/useProximoPassoFeedback';

interface Props {
  passoId: string;
  contactId: string;
  channelHint?: string | null;
}

interface OutcomeOption {
  value: PassoOutcome;
  label: string;
  icon: typeof Check;
  className: string;
}

const OPTIONS: OutcomeOption[] = [
  {
    value: 'respondeu_positivo',
    label: 'Respondeu — positivo',
    icon: MessageSquareReply,
    className: 'text-success',
  },
  {
    value: 'respondeu_neutro',
    label: 'Respondeu — neutro',
    icon: MessageSquare,
    className: 'text-info',
  },
  {
    value: 'nao_respondeu',
    label: 'Não respondeu',
    icon: VolumeX,
    className: 'text-warning',
  },
  {
    value: 'nao_atendeu',
    label: 'Não atendeu',
    icon: PhoneOff,
    className: 'text-warning',
  },
  {
    value: 'pulou',
    label: 'Pular por 7 dias',
    icon: SkipForward,
    className: 'text-muted-foreground',
  },
];

const TOAST_LABEL: Record<PassoOutcome, string> = {
  respondeu_positivo: 'Ótimo! Marcado como resposta positiva.',
  respondeu_neutro: 'Resposta neutra registrada.',
  nao_respondeu: 'Sem resposta registrada — vamos rebaixar a prioridade.',
  nao_atendeu: 'Sem retorno registrado.',
  pulou: 'Passo silenciado por 7 dias.',
};

const CONFIRM_DESCRIPTION: Record<PassoOutcome, string> = {
  respondeu_positivo: 'Vamos registrar como interação positiva e manter o ritmo.',
  respondeu_neutro: 'Vamos registrar como conversa morna, sem sinais fortes.',
  nao_respondeu: 'Vamos marcar que não houve resposta e rebaixar a prioridade.',
  nao_atendeu: 'Vamos registrar tentativa sem retorno na ligação.',
  pulou: 'Este passo ficará silenciado pelos próximos 7 dias.',
};

function PassoFeedbackMenuComponent({ passoId, contactId, channelHint }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [pendingOutcome, setPendingOutcome] = useState<PassoOutcome | null>(null);
  const { mutate, isPending } = useRegisterPassoFeedback();

  const resetAndClose = () => {
    setNotes('');
    setPendingOutcome(null);
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingOutcome(null);
      setNotes('');
    }
    setOpen(next);
  };

  const handleConfirm = () => {
    if (!pendingOutcome) return;
    const outcome = pendingOutcome;
    mutate(
      {
        contactId,
        passoId,
        outcome,
        channelUsed: channelHint ?? null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Feedback registrado', { description: TOAST_LABEL[outcome] });
          resetAndClose();
        },
        onError: (err) => {
          toast.error('Não foi possível registrar', {
            description: err instanceof Error ? err.message : 'Tente novamente.',
          });
        },
      },
    );
  };

  const pendingOption = pendingOutcome ? OPTIONS.find((o) => o.value === pendingOutcome) : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="outline">
          <Check className="h-3 w-3" />
          Feito
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {pendingOption ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Confirmar registro?</p>
              <p className="text-xs text-muted-foreground">
                Revise antes de salvar — a ação é registrada no histórico.
              </p>
            </div>

            <div className="rounded-md border bg-muted/40 p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <pendingOption.icon className={`h-4 w-4 ${pendingOption.className}`} />
                <span className="text-sm font-medium">{pendingOption.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {CONFIRM_DESCRIPTION[pendingOption.value]}
              </p>
              {notes ? (
                <p className="text-[11px] text-muted-foreground border-t pt-1.5 mt-1.5">
                  <span className="font-medium">Observação:</span> {notes}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setPendingOutcome(null)}
                disabled={isPending}
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar
              </Button>
              <Button size="xs" onClick={handleConfirm} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Como foi?</p>
              <p className="text-xs text-muted-foreground">
                Seu feedback melhora as próximas recomendações.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2"
                    disabled={isPending}
                    onClick={() => setPendingOutcome(opt.value)}
                  >
                    <Icon className={`h-3.5 w-3.5 ${opt.className}`} />
                    <span className="text-xs">{opt.label}</span>
                  </Button>
                );
              })}
            </div>

            <div className="space-y-1">
              <label htmlFor={`notes-${passoId}`} className="text-xs text-muted-foreground">
                Observação (opcional)
              </label>
              <Input
                id={`notes-${passoId}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                placeholder="Ex.: pediu para retomar em 15 dias"
                maxLength={200}
                className="h-8 text-xs"
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setNotes('');
                  setOpen(false);
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const PassoFeedbackMenu = memo(PassoFeedbackMenuComponent);
