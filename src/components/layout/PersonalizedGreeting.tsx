import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Cloud, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getGreeting } from '@/lib/ux-messages';
import { cn } from '@/lib/utils';

interface PersonalizedGreetingProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PersonalizedGreeting({ 
  className, 
  showIcon = true,
  size = 'md',
}: PersonalizedGreetingProps) {
  const { user } = useAuth();
  
  const { greeting, Icon, period } = useMemo(() => {
    const hour = new Date().getHours();
    let period: 'morning' | 'afternoon' | 'evening';
    let Icon: typeof Sun;
    
    if (hour < 12) {
      period = 'morning';
      Icon = Sun;
    } else if (hour < 18) {
      period = 'afternoon';
      Icon = Cloud;
    } else {
      period = 'evening';
      Icon = Moon;
    }
    
    // Get first name from user metadata
    const firstName = user?.user_metadata?.first_name || 
                      user?.email?.split('@')[0] ||
                      undefined;
    
    const greeting = getGreeting(firstName);
    
    return { greeting, Icon, period };
  }, [user]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-semibold',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const iconColors = {
    morning: 'text-yellow-500',
    afternoon: 'text-orange-400',
    evening: 'text-indigo-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-center gap-2', className)}
    >
      {showIcon && (
        <motion.div
          animate={{ 
            rotate: period === 'morning' ? [0, 10, -10, 0] : 0,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatDelay: 5,
          }}
        >
          <Icon className={cn(iconSizeClasses[size], iconColors[period])} />
        </motion.div>
      )}
      <span className={cn(sizeClasses[size], 'text-foreground')}>
        {greeting}
      </span>
      {size === 'lg' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="ml-1"
        >
          <Sparkles className="w-5 h-5 text-primary/60" />
        </motion.div>
      )}
    </motion.div>
  );
}
