import { motion } from 'framer-motion';
import { Calendar, Sun, Moon, Sunset } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function formatDisplayName(raw: string): string {
  // Remove numbers, underscores, dots, hyphens
  const cleaned = raw.replace(/[0-9_\-.]+/g, ' ').trim();
  if (!cleaned || cleaned.length < 3) return '';
  // Reject names that look like technical IDs (e.g. "adm", "usr", "test")
  const techPatterns = /^(adm|usr|admin|test|user|dev|root|sys|tmp)$/i;
  if (techPatterns.test(cleaned)) return '';
  // Capitalize each word
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GreetingIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {firstName ? `${greeting}, ${firstName}` : 'Olá! 👋'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{today}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
