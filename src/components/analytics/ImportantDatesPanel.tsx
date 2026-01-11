import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Gift, Users, FileText, Trophy, Clock, Copy, Bell } from 'lucide-react';
import { useImportantDates, ImportantDate } from '@/hooks/useImportantDates';
import { Contact, Interaction } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ImportantDatesPanelProps {
  contacts: Contact[];
  interactions: Interaction[];
  singleContact?: Contact;
}

const typeIcons: Record<string, any> = {
  birthday: Gift,
  anniversary: Users,
  contract_renewal: FileText,
  first_purchase: Trophy,
  milestone: Trophy,
  custom: Calendar
};

const urgencyColors: Record<string, string> = {
  overdue: 'bg-destructive text-destructive-foreground',
  today: 'bg-success text-success-foreground',
  urgent: 'bg-warning text-warning-foreground',
  upcoming: 'bg-primary text-primary-foreground',
  future: 'bg-muted text-muted-foreground'
};

const urgencyLabels: Record<string, string> = {
  overdue: 'Atrasado',
  today: 'Hoje!',
  urgent: 'Esta semana',
  upcoming: 'Em breve',
  future: 'Futuro'
};

function DateCard({ date }: { date: ImportantDate }) {
  const Icon = typeIcons[date.type] || Calendar;

  const copyMessage = () => {
    navigator.clipboard.writeText(date.messageTemplate);
    toast.success('Mensagem copiada!');
  };

  return (
    <div className={`p-3 rounded-lg border ${date.urgency === 'today' || date.urgency === 'overdue' ? 'border-2' : ''} ${date.urgency === 'today' ? 'border-success bg-success/5' : date.urgency === 'overdue' ? 'border-destructive bg-destructive/5' : 'bg-muted/30'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${urgencyColors[date.urgency]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{date.title}</span>
            <Badge className={urgencyColors[date.urgency]} variant="secondary">
              {urgencyLabels[date.urgency]}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">{date.contactName}</span>
            <span className="mx-2">•</span>
            <span>{format(date.date, "dd 'de' MMMM", { locale: ptBR })}</span>
            {date.daysUntil !== 0 && (
              <>
                <span className="mx-2">•</span>
                <span>{date.daysUntil > 0 ? `Em ${date.daysUntil} dias` : `Há ${Math.abs(date.daysUntil)} dias`}</span>
              </>
            )}
          </div>
          <p className="text-xs mt-2">{date.suggestedAction}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={copyMessage} title="Copiar mensagem sugerida">
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function ImportantDatesPanel({ contacts, interactions, singleContact }: ImportantDatesPanelProps) {
  const filteredContacts = singleContact ? [singleContact] : contacts;
  const reminders = useImportantDates(filteredContacts, interactions);

  const displayDates = singleContact 
    ? reminders.allDates.filter(d => d.contactId === singleContact.id)
    : reminders.allDates;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Datas Importantes
            </CardTitle>
            {reminders.hasUrgent && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                {reminders.summary}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-destructive/10 text-center">
              <div className="text-lg font-bold text-destructive">{reminders.overdue.length}</div>
              <div className="text-xs text-muted-foreground">Atrasadas</div>
            </div>
            <div className="p-2 rounded-lg bg-success/10 text-center">
              <div className="text-lg font-bold text-success">{reminders.today.length}</div>
              <div className="text-xs text-muted-foreground">Hoje</div>
            </div>
            <div className="p-2 rounded-lg bg-warning/10 text-center">
              <div className="text-lg font-bold text-warning">{reminders.thisWeek.length}</div>
              <div className="text-xs text-muted-foreground">Esta Semana</div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-center">
              <div className="text-lg font-bold text-primary">{reminders.thisMonth.length}</div>
              <div className="text-xs text-muted-foreground">Este Mês</div>
            </div>
          </div>

          {/* Date List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayDates.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma data importante próxima</p>
              </div>
            ) : (
              displayDates.slice(0, 10).map(date => (
                <DateCard key={date.id} date={date} />
              ))
            )}
          </div>

          {displayDates.length > 10 && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                E mais {displayDates.length - 10} datas...
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
