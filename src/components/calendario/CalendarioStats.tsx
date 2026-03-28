import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';

interface CalendarioStatsProps {
  stats: {
    total: number;
    overdue: number;
    today: number;
    upcoming: number;
  };
}

export const CalendarioStats = ({ stats }: CalendarioStatsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <MorphingNumber value={stats.total} className="text-2xl font-bold" />
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <MorphingNumber value={stats.overdue} className="text-2xl font-bold text-destructive" />
            <p className="text-sm text-muted-foreground">Atrasados</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <MorphingNumber value={stats.today} className="text-2xl font-bold text-orange-500" />
            <p className="text-sm text-muted-foreground">Hoje</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <MorphingNumber value={stats.upcoming} className="text-2xl font-bold text-green-500" />
            <p className="text-sm text-muted-foreground">Próximos</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
