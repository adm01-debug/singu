import { ReactNode, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'relative overflow-hidden rounded-xl border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-card border-border/50 shadow-soft hover:shadow-medium hover:border-border',
        elevated: 'bg-card border-border/40 shadow-medium',
        glass: 'glass',
        interactive: 'bg-card border-border/50 shadow-soft cursor-pointer hover:shadow-medium hover:border-border active:scale-[0.99]',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  gradientTone?: 'primary' | 'success' | 'warning' | 'premium';
  className?: string;
  delay?: number;
  animate?: boolean;
  sparkline?: number[];
  onClick?: () => void;
  emptyAction?: { label: string; href: string };
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30, mass: 1 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => { motionValue.set(value); }, [value, motionValue]);
  useEffect(() => {
    const unsub = display.on('change', (v) => { if (ref.current) ref.current.textContent = v; });
    return unsub;
  }, [display]);

  return <span ref={ref} className={className}>0</span>;
}

export function StatCard({
  title, value, change, changeType = 'neutral', icon: Icon,
  iconColor = 'bg-primary/8 text-primary', className, delay = 0,
  variant, size, animate = true, sparkline, onClick, emptyAction,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, ''));
  const isNumeric = typeof value === 'number' && !isNaN(numericValue);

  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.04 }}
      onClick={onClick}
      className={cn(statCardVariants({ variant, size }), className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {isNumeric && animate ? <AnimatedNumber value={numericValue} /> : value}
          </p>
          
          {change && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                <ChangeIcon className="w-3 h-3" aria-hidden="true" />
                {change}
              </span>
            </div>
          )}
          
          {emptyAction && numericValue === 0 && (
            <Link 
              to={emptyAction.href}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
            >
              {emptyAction.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className={cn('p-2.5 rounded-xl shrink-0', iconColor)}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
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
        <div className="p-1.5 bg-muted/60 rounded-lg">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn('text-xs', trend === 'up' && 'text-success', trend === 'down' && 'text-destructive')}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>;
}

export function HeroStat({ title, value, subtitle, icon: Icon, className }: {
  title: string; value: string | number; subtitle?: string; icon?: LucideIcon;
  gradient?: boolean; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('relative overflow-hidden rounded-2xl p-8 text-center bg-card border border-border/50', className)}
    >
      {Icon && (
        <div className="inline-flex p-4 rounded-2xl bg-primary/8 mb-4">
          <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
      )}
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
