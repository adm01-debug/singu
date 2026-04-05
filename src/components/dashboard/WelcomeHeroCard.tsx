import { motion } from 'framer-motion';
import { Calendar, Sun, Moon, Sunset, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

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
  let gradientFrom: string;
  let gradientTo: string;
  if (hour < 12) { 
    greeting = 'Bom dia'; 
    GreetingIcon = Sun; 
    gradientFrom = 'from-amber-500/20';
    gradientTo = 'to-orange-500/10';
  } else if (hour < 18) { 
    greeting = 'Boa tarde'; 
    GreetingIcon = Sunset; 
    gradientFrom = 'from-primary/20';
    gradientTo = 'to-accent/10';
  } else { 
    greeting = 'Boa noite'; 
    GreetingIcon = Moon; 
    gradientFrom = 'from-indigo-500/20';
    gradientTo = 'to-primary/10';
  }

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} via-card ${gradientTo} border border-border p-6 md:p-8`}
    >
      {/* Animated decorative orbs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" 
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-accent/15 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" 
      />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-5">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow"
          >
            <GreetingIcon className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
            >
              {firstName ? `${greeting}, ${firstName}` : `${greeting}! ✨`}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-3 mt-1.5"
            >
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="hidden md:flex items-center gap-3"
        >
          <Link 
            to="/contatos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/20 hover:border-primary/40 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">SINGU AI</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 -ml-1 group-hover:ml-0 transition-all" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
