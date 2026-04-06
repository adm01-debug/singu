import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, Moon, Sunset, Sparkles, ArrowRight, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates whether a name is "real" enough to display.
 * Filters out technical IDs, email prefixes, and nonsensical strings.
 */
function formatDisplayName(raw: string): string {
  const cleaned = raw.replace(/[0-9_\-.]+/g, ' ').trim();
  if (!cleaned || cleaned.length < 4) return '';
  const techPatterns = /^(adm|usr|admin|test|user|dev|root|sys|tmp|info|noreply|contato|suporte|equipe|vendas|sac)$/i;
  if (techPatterns.test(cleaned)) return '';
  const vowelCount = (cleaned.match(/[aeiouáéíóúâêîôûãõ]/gi) || []).length;
  if (vowelCount < 2) return '';
  return cleaned
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function WelcomeHeroCard() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string>('');
  
  // Fetch name from profiles table as primary source
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.first_name) {
          const name = formatDisplayName(data.first_name);
          if (name) setProfileName(name);
        }
      });
  }, [user?.id]);

  const hour = new Date().getHours();
  const rawName = user?.user_metadata?.first_name 
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.display_name?.split(' ')[0]
    || user?.email?.split('@')[0] 
    || '';
  const metadataName = formatDisplayName(rawName);
  const firstName = profileName || metadataName;
  const hasProfile = !!profileName || !!user?.user_metadata?.first_name;
  
  let greeting: string;
  let GreetingIcon: typeof Sun;
  if (hour < 12) { 
    greeting = 'Bom dia'; 
    GreetingIcon = Sun; 
  } else if (hour < 18) { 
    greeting = 'Boa tarde'; 
    GreetingIcon = Sunset; 
  } else { 
    greeting = 'Boa noite'; 
    GreetingIcon = Moon; 
  }

  const today = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).format(new Date());
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1).toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.14),transparent_20%),radial-gradient(circle_at_88%_0%,hsl(var(--accent)/0.14),transparent_28%),linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--surface-2))_55%,hsl(var(--surface-3))_100%)] px-4 py-3 md:px-6 md:py-4 group shadow-[0_24px_64px_-32px_hsl(var(--primary)/0.32)] hover:border-primary/35 transition-colors duration-300"
    >
      {/* Animated decorative orbs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/20 via-warning/8 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" 
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-accent/14 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" 
      />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-5">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary via-nexus-cyan to-accent flex items-center justify-center shrink-0 ring-1 ring-primary/35 shadow-[0_12px_28px_-12px_hsl(var(--nexus-glow)/0.6)]"
          >
            <GreetingIcon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-lg md:text-2xl font-bold text-foreground tracking-tight"
            >
              {firstName ? `${greeting}, ${firstName}` : `${greeting}! ✨`}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-3 mt-1"
            >
              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>{formattedDate}</span>
              </p>
              {/* Profile completion nudge */}
              {!hasProfile && !firstName && (
                <Link 
                  to="/configuracoes" 
                  className="text-xs text-primary/80 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <UserCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Completar perfil</span>
                </Link>
              )}
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card/70 border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 group/ai shadow-[0_18px_44px_-30px_hsl(var(--nexus-glow)/0.45)]"
          >
            <Sparkles className="w-4 h-4 text-primary group-hover/ai:animate-pulse" />
            <span className="text-sm font-semibold text-primary">SINGU AI</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover/ai:opacity-100 -ml-1 group-hover/ai:ml-0 transition-all duration-300" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
