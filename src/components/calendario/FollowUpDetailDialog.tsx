import { User, Building2, CheckCircle2 } from 'lucide-react';
import { isToday, parseISO, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { FollowUp } from './types';
import { interactionTypeIcons, interactionTypeLabels } from './types';

interface FollowUpDetailDialogProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
}

export const FollowUpDetailDialog = ({
  followUp,
  onClose,
  onMarkCompleted,
}: FollowUpDetailDialogProps) => {
  return (
    <Dialog open={!!followUp} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {followUp && interactionTypeIcons[followUp.type]}
            {followUp?.title}
          </DialogTitle>
        </DialogHeader>

        {followUp && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {interactionTypeLabels[followUp.type] || followUp.type}
              </Badge>
              {followUp.follow_up_date && isPast(parseISO(followUp.follow_up_date)) && !isToday(parseISO(followUp.follow_up_date)) && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
            </div>

            <Separator />

            {followUp.contact && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">
                    {followUp.contact.first_name} {followUp.contact.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">Contato</p>
                </div>
              </div>
            )}

            {followUp.company && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium">{followUp.company.name}</p>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                </div>
              </div>
            )}

            {followUp.content && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{followUp.content}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <Button
                className="flex-1 gap-2"
                onClick={() => onMarkCompleted(followUp.id)}
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Concluído
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
