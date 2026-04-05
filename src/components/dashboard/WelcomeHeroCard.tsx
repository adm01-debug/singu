import { motion } from 'framer-motion';
import { Calendar, Sun, Moon, Sunset, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function formatDisplayName(raw: string): string {
  const cleaned = raw.replace(/[0-9_\-.]+/g, ' ').trim();
  if (!cleaned || cleaned.length < 3) return '';
  const techPatterns = /^(adm|usr|admin|test|user|dev|root|sys|tmp)$/i;
  if (techPatterns.test(cleaned)) return '';
  return cleaned
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function WelcomeHeroCard() {
  const { user } = useAuth();
  
  const hour = new Date().getHours();
  const rawName = user?.user_metadata?.first_name 
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.display_name?.split(' ')[0]
    || user?.email?.split('@')[0] 
    || '';
  const firstName = formatDisplayName(rawName);
  
  let greeting: string;
  let GreetingIcon: typeof Sun;
  if (hour < 12) { greeting = 'Bom dia'; GreetingIcon = Sun; }
  else if (hour < 18) { greeting = 'Boa tarde'; GreetingIcon = Sunset; }
  else { greeting = 'Boa noite'; GreetingIcon = Moon; }

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border border-primary/20 p-6 md:p-8"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
          >
            <GreetingIcon className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {firstName ? `${greeting}, ${firstName}` : `${greeting}! ✨`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">SINGU AI</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
