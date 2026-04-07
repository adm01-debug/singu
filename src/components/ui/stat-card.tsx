import { ReactNode, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'relative overflow-hidden rounded-[24px] border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-[linear-gradient(145deg,hsl(var(--card))_0%,hsl(var(--surface-2))_100%)] border-border/80 shadow-none hover:border-primary/35',
        elevated: 'bg-[linear-gradient(145deg,hsl(var(--card))_0%,hsl(var(--surface-3))_100%)] border-border/85 shadow-none hover:border-primary/40',
        glass: 'glass shadow-none',
        interactive: 'bg-[linear-gradient(145deg,hsl(var(--card))_0%,hsl(var(--surface-2))_100%)] border-border/80 shadow-none cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 active:scale-[0.99]',
      },
      size: {
        sm: 'p-3',
        default: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const gradientToneMap = {
  primary: 'from-primary via-nexus-cyan to-accent',
  success: 'from-success via-nexus-teal to-accent',
  warning: 'from-warning via-nexus-amber to-warning/55',
  premium: 'from-primary via-nexus-cyan to-nexus-purple',
};

const iconBgMap = {
  primary: 'bg-primary/15 text-primary ring-1 ring-primary/25',
  success: 'bg-success/15 text-success ring-1 ring-success/25',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/25',
  premium: 'bg-accent/15 text-accent ring-1 ring-accent/25',
};

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
  subtitle?: string;
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

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(' L')}`;
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  
  return (
    <svg width={w} height={h} className="opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`hsl(var(--${color}))`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color})`} />
      <path d={pathD} fill="none" stroke={`hsl(var(--${color}))`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({
  title, value, change, changeType = 'neutral', icon: Icon,
  iconColor, className, delay = 0,
  variant, size, animate = true, sparkline, onClick, emptyAction,
  gradientTone = 'primary', subtitle,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, ''));
  const isNumeric = typeof value === 'number' && !isNaN(numericValue);

  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;
  const resolvedIconBg = iconBgMap[gradientTone] || iconColor || 'bg-primary/15 text-primary';
  const sparkColor = gradientTone === 'success' ? 'success' : gradientTone === 'warning' ? 'warning' : gradientTone === 'premium' ? 'accent' : 'primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -4 }}
      transition={{ duration: 0.3, delay: delay * 0.04 }}
      onClick={onClick}
      className={cn(statCardVariants({ variant, size }), 'group', className)}
    >
      {/* Gradient top border */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-xl',
        gradientToneMap[gradientTone]
      )} />

      {/* Subtle background glow on hover */}
      <div className={cn(
        'absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500',
        gradientTone === 'primary' && 'bg-primary',
        gradientTone === 'success' && 'bg-success',
        gradientTone === 'warning' && 'bg-warning',
        gradientTone === 'premium' && 'bg-accent',
      )} />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {isNumeric && animate ? <AnimatedNumber value={numericValue} /> : value}
            </p>
            {/* Inline sparkline */}
            {sparkline && sparkline.length > 1 && (
              <MiniSparkline data={sparkline} color={sparkColor} />
            )}
          </div>
          
          {change && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                changeType === 'positive' && 'text-success bg-success/12',
                changeType === 'negative' && 'text-destructive bg-destructive/12',
                changeType === 'neutral' && 'text-muted-foreground bg-muted/80'
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
          
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <div className={cn('p-3.5 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow', resolvedIconBg)}>
          <Icon className="w-5 h-5" aria-hidden="true" />
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
      className={cn('relative overflow-hidden rounded-2xl p-8 text-center bg-card border border-border', className)}
    >
      {Icon && (
        <div className="inline-flex p-4 rounded-2xl bg-primary/12 mb-4">
          <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
      )}
      <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
