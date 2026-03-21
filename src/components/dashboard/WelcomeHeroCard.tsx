import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Typography } from '@/components/ui/typography';
import { Surface } from '@/components/ui/surface';
import { MiniStat } from '@/components/ui/stat-card';

interface WelcomeHeroCardProps {
  totalContacts: number;
  weeklyInteractions: number;
  averageScore: string | number;
}

export function WelcomeHeroCard({ totalContacts, weeklyInteractions, averageScore }: WelcomeHeroCardProps) {
  const { user } = useAuth();
  
  const hour = new Date().getHours();
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';
  
  let greeting: string;
  if (hour < 12) greeting = 'Bom dia';
  else if (hour < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Surface level={1} rounded="xl" className="relative overflow-hidden p-6 ring-1 ring-border/50">
        {/* Subtle gradient mesh */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-[0.06] pointer-events-none" style={{ background: 'var(--gradient-premium)' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography variant="h3" gradient>
              {greeting}, {firstName}! <span aria-hidden="true">👋</span>
            </Typography>
            <Typography variant="small" className="mt-1.5 capitalize text-muted-foreground">
              {today}
            </Typography>
          </div>

          <div className="flex items-center gap-6">
            <MiniStat label="contatos" value={totalContacts} icon={Users} />
            <MiniStat label="interações" value={weeklyInteractions} icon={Calendar} trend="up" />
            <MiniStat label="score" value={`${averageScore}%`} icon={TrendingUp} />
          </div>
        </div>
      </Surface>
    </motion.div>
  );
}
