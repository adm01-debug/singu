import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  let emoji: string;
  if (hour < 12) { greeting = 'Bom dia'; emoji = '☀️'; }
  else if (hour < 18) { greeting = 'Boa tarde'; emoji = '🌤️'; }
  else { greeting = 'Boa noite'; emoji = '🌙'; }

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());

  const stats = [
    { label: 'Contatos', value: totalContacts, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Interações', value: weeklyInteractions, icon: Activity, color: 'text-accent', bgColor: 'bg-accent/10' },
    { label: 'Score', value: `${averageScore}%`, icon: TrendingUp, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-xl border border-border/40 bg-card"
    >
      {/* Gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.035]" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04]" style={{ background: 'var(--gradient-premium)' }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-[0.03]" style={{ background: 'var(--gradient-primary)' }} />
      </div>

      <div className="relative px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Greeting */}
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
            {greeting}, {firstName}! <span className="text-lg">{emoji}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {today}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-1">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <stat.icon className={`w-3.5 h-3.5 ${stat.color} shrink-0`} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-foreground tabular-nums">{stat.value}</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
