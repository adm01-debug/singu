import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================
// ENHANCED STAT CARD - Pilar 4 & 10
// ============================================

const statCardVariants = cva(
  'relative overflow-hidden rounded-xl border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-card border-border hover:shadow-md',
        elevated: 'bg-card border-border/50 shadow-lg hover:shadow-xl',
        gradient: 'bg-gradient-to-br border-0',
        glass: 'bg-card/80 backdrop-blur-xl border-border/50',
        outlined: 'bg-transparent border-2',
        interactive: 'bg-card border-border cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  changeValue?: number;
  icon: LucideIcon;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  delay?: number;
  animate?: boolean;
  sparkline?: number[];
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  changeValue,
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  gradientFrom,
  gradientTo,
  className,
  delay = 0,
  variant,
  size,
  animate = true,
  sparkline,
  onClick,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : Number(value) || 0);
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, ''));

  // Animate number counting up
  useEffect(() => {
    if (!animate || isNaN(numericValue)) return;
    
    const duration = 1000;
    const steps = 20;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue, animate]);

  const getChangeIcon = () => {
    if (changeType === 'positive') return TrendingUp;
    if (changeType === 'negative') return TrendingDown;
    return Minus;
  };

  const ChangeIcon = getChangeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={variant === 'interactive' ? { scale: 1.02 } : undefined}
      whileTap={variant === 'interactive' ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        statCardVariants({ variant, size }),
        variant === 'gradient' && `from-${gradientFrom} to-${gradientTo}`,
        className
      )}
      style={variant === 'gradient' ? {
        background: `linear-gradient(135deg, ${gradientFrom || 'hsl(var(--primary))'}, ${gradientTo || 'hsl(var(--primary) / 0.8)'})`
      } : undefined}
    >
      {/* Sparkline Background */}
      {sparkline && sparkline.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
          <svg className="w-full h-full" viewBox={`0 0 ${sparkline.length * 10} 40`} preserveAspectRatio="none">
            <path
              d={`M0,${40 - (sparkline[0] / Math.max(...sparkline)) * 40} ${sparkline.map((v, i) => 
                `L${i * 10},${40 - (v / Math.max(...sparkline)) * 40}`
              ).join(' ')} L${(sparkline.length - 1) * 10},40 L0,40 Z`}
              fill="currentColor"
              className={cn(
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-primary'
              )}
            />
          </svg>
        </div>
      )}

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn(
            'text-sm font-medium',
            variant === 'gradient' ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold tabular-nums',
            variant === 'gradient' ? 'text-white' : 'text-foreground'
          )}>
            {typeof value === 'number' ? displayValue.toLocaleString() : value}
          </p>
          
          {/* Change indicator */}
          {change && (
            <div className="flex items-center gap-1.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay * 0.1 + 0.3, type: 'spring' }}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  changeType === 'positive' && 'bg-success/10 text-success',
                  changeType === 'negative' && 'bg-destructive/10 text-destructive',
                  changeType === 'neutral' && 'bg-muted text-muted-foreground'
                )}
              >
                <ChangeIcon className="w-3 h-3" />
                {change}
              </motion.div>
            </div>
          )}
        </div>

        {/* Icon */}
        <motion.div 
          className={cn(
            'p-3 rounded-xl',
            variant === 'gradient' ? 'bg-white/20' : iconColor
          )}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={cn(
            'w-6 h-6',
            variant === 'gradient' && 'text-white'
          )} />
        </motion.div>
      </div>

      {/* Decorative gradient overlay */}
      {variant !== 'gradient' && (
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
          <Icon className="w-full h-full" />
        </div>
      )}
    </motion.div>
  );
}

// Compact stat for inline display
interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MiniStat({ label, value, icon: Icon, trend, className }: MiniStatProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Icon && (
        <div className="p-1.5 bg-muted rounded-md">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn(
            'text-xs',
            trend === 'up' && 'text-success',
            trend === 'down' && 'text-destructive'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

// Stats row for dashboard
interface StatsRowProps {
  children: ReactNode;
  className?: string;
}

export function StatsRow({ children, className }: StatsRowProps) {
  return (
    <div className={cn(
      'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
}

// Large display stat (hero stat)
interface HeroStatProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  gradient?: boolean;
  className?: string;
}

export function HeroStat({ title, value, subtitle, icon: Icon, gradient, className }: HeroStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-8 text-center',
        gradient 
          ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
          : 'bg-card border',
        className
      )}
    >
      {Icon && (
        <div className={cn(
          'inline-flex p-4 rounded-2xl mb-4',
          gradient ? 'bg-white/20' : 'bg-primary/10'
        )}>
          <Icon className={cn('w-8 h-8', gradient ? 'text-white' : 'text-primary')} />
        </div>
      )}
      <p className={cn(
        'text-sm font-medium mb-2',
        gradient ? 'text-white/80' : 'text-muted-foreground'
      )}>
        {title}
      </p>
      <p className={cn(
        'text-5xl font-bold mb-2',
        gradient ? 'text-white' : 'text-foreground'
      )}>
        {value}
      </p>
      {subtitle && (
        <p className={cn(
          'text-sm',
          gradient ? 'text-white/70' : 'text-muted-foreground'
        )}>
          {subtitle}
        </p>
      )}
      
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />
    </motion.div>
  );
}
