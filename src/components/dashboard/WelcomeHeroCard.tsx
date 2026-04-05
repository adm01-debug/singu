import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function WelcomeHeroCard() {
  const { user } = useAuth();
  
  const hour = new Date().getHours();
  const rawName = user?.user_metadata?.first_name 
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.display_name?.split(' ')[0]
    || user?.email?.split('@')[0] 
    || '';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  
  let greeting: string;
  if (hour < 12) greeting = 'Bom dia';
  else if (hour < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span className="capitalize">{today}</span>
        </p>
      </div>
    </motion.div>
  );
}
