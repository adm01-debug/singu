import { ReminderSummary } from '@/hooks/useSmartReminders';

interface SummaryStatsProps {
  summary: ReminderSummary;
}

export const SummaryStats = ({ summary }: SummaryStatsProps) => {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      <div className="p-2 rounded-lg bg-blue-500/10 text-center">
        <p className="text-lg font-bold text-blue-600">{summary.byType.follow_up}</p>
        <p className="text-[10px] text-muted-foreground">Follow-ups</p>
      </div>
      <div className="p-2 rounded-lg bg-amber-500/10 text-center">
        <p className="text-lg font-bold text-amber-600">{summary.byType.birthday}</p>
        <p className="text-[10px] text-muted-foreground">Aniversários</p>
      </div>
      <div className="p-2 rounded-lg bg-red-500/10 text-center">
        <p className="text-lg font-bold text-red-600">{summary.byType.decay}</p>
        <p className="text-[10px] text-muted-foreground">Esfriando</p>
      </div>
      <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
        <p className="text-lg font-bold text-emerald-600">{summary.byType.milestone}</p>
        <p className="text-[10px] text-muted-foreground">Marcos</p>
      </div>
    </div>
  );
};
