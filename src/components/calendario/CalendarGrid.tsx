import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FollowUp } from './types';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  followUpsByDate: Record<string, FollowUp[]>;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarGrid = ({
  currentMonth,
  selectedDate,
  followUpsByDate,
  onMonthChange,
  onDateSelect,
}: CalendarGridProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="lg:col-span-2"
    >
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onMonthChange(new Date());
                  onDateSelect(new Date());
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-24" />
            ))}

            {/* Actual days */}
            {daysInMonth.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayFollowUps = followUpsByDate[dateKey] || [];
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasOverdue = dayFollowUps.some(f => isPast(parseISO(f.follow_up_date!)) && !isToday(parseISO(f.follow_up_date!)));

              return (
                <button
                  key={dateKey}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    'h-24 p-1 rounded-lg border transition-all duration-200 flex flex-col',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border/50 hover:border-primary/50 hover:bg-muted/50',
                    isToday(day) && !isSelected && 'border-primary/50 bg-primary/5',
                    !isSameMonth(day, currentMonth) && 'opacity-50'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday(day) && 'bg-primary text-primary-foreground',
                    isSelected && !isToday(day) && 'bg-primary/20'
                  )}>
                    {format(day, 'd')}
                  </span>

                  {dayFollowUps.length > 0 && (
                    <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                      {dayFollowUps.slice(0, 2).map(followUp => (
                        <div
                          key={followUp.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate',
                            hasOverdue
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-primary/20 text-primary'
                          )}
                        >
                          {followUp.title}
                        </div>
                      ))}
                      {dayFollowUps.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayFollowUps.length - 2} mais
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
