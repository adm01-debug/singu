import { memo } from 'react';
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

export const WelcomeHeroCard = memo(function WelcomeHeroCard({ totalContacts, weeklyInteractions, averageScore }: WelcomeHeroCardProps) {
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
      <Surface level={1} rounded="xl" className="relative overflow-hidden p-6">
        {/* Gradient accent */}
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
          <Sparkles className="w-full h-full text-primary" aria-hidden="true" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography variant="h3" gradient>
              {greeting}, {firstName}! <span aria-hidden="true">👋</span>
            </Typography>
            <Typography variant="small" className="mt-1 capitalize">
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
});
