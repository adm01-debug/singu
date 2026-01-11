import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// Confetti Burst Animation
interface ConfettiBurstProps {
  trigger: boolean;
  colors?: string[];
  particleCount?: number;
  duration?: number;
}

export function ConfettiBurst({
  trigger,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  particleCount = 20,
  duration = 1000,
}: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200 - 50,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, particleCount, colors, duration]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 1, 
              x: 0, 
              y: 0, 
              rotate: 0,
              scale: 1 
            }}
            animate={{ 
              opacity: 0, 
              x: particle.x, 
              y: particle.y,
              rotate: particle.rotation,
              scale: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Haptic Button with visual feedback
interface HapticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

export function HapticButton({
  children,
  onClick,
  className,
  hapticStyle = 'medium',
}: HapticButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      const duration = hapticStyle === 'light' ? 10 : hapticStyle === 'heavy' ? 50 : 25;
      navigator.vibrate(duration);
    }
    
    onClick?.();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <motion.button
      className={cn('relative', className)}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      animate={isPressed ? { scale: [1, 0.95, 1] } : {}}
      transition={{ duration: 0.15 }}
    >
      {children}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full bg-primary/20"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Glowing Progress Ring
interface GlowingProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  showPercentage?: boolean;
  animate?: boolean;
}

export function GlowingProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'hsl(var(--primary))',
  glowColor = 'hsl(var(--primary) / 0.4)',
  showPercentage = true,
  animate = true,
}: GlowingProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const springProgress = useSpring(0, { stiffness: 50, damping: 20 });
  const strokeDashoffset = useTransform(
    springProgress,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    if (animate) {
      springProgress.set(progress);
    }
  }, [progress, animate, springProgress]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring with glow */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: animate ? strokeDashoffset : circumference * (1 - progress / 100) }}
          filter="url(#glow)"
        />
        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {showPercentage && (
        <motion.span
          className="absolute text-sm font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  );
}

// Typing Indicator
interface TypingIndicatorProps {
  className?: string;
  dotSize?: number;
  color?: string;
}

export function TypingIndicator({
  className,
  dotSize = 8,
  color = 'bg-muted-foreground',
}: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', color)}
          style={{ width: dotSize, height: dotSize }}
          animate={{ 
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Success Animation with checkmark
interface SuccessAnimationProps {
  show: boolean;
  size?: number;
  onComplete?: () => void;
}

export function SuccessAnimation({
  show,
  size = 64,
  onComplete,
}: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onAnimationComplete={() => onComplete?.()}
          className="relative"
          style={{ width: size, height: size }}
        >
          {/* Circle */}
          <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
          
          {/* Checkmark */}
          <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className="absolute inset-0"
          >
            <motion.path
              d="M20 32 L28 40 L44 24"
              fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pulse Ring Animation
interface PulseRingProps {
  children: React.ReactNode;
  isActive?: boolean;
  color?: string;
  className?: string;
}

export function PulseRing({
  children,
  isActive = false,
  color = 'bg-primary',
  className,
}: PulseRingProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {isActive && (
        <>
          <motion.span
            className={cn('absolute inset-0 rounded-full', color, 'opacity-75')}
            animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.span
            className={cn('absolute inset-0 rounded-full', color, 'opacity-75')}
            animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}
      {children}
    </div>
  );
}

// Shimmer Text
interface ShimmerTextProps {
  children: string;
  className?: string;
}

export function ShimmerText({ children, className }: ShimmerTextProps) {
  return (
    <motion.span
      className={cn(
        'inline-block bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent',
        className
      )}
      animate={{ backgroundPosition: ['0%', '200%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  );
}

// Bounce Notification Badge
interface BounceNotificationBadgeProps {
  count: number;
  className?: string;
}

export function BounceNotificationBadge({
  count,
  className,
}: BounceNotificationBadgeProps) {
  const prevCount = useRef(count);

  useEffect(() => {
    prevCount.current = count;
  }, [count]);

  const hasIncreased = count > prevCount.current;

  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={count}
          initial={hasIncreased ? { scale: 0 } : { scale: 1 }}
          animate={hasIncreased ? { scale: [0, 1.3, 1] } : { scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className={cn(
            'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center',
            'rounded-full bg-destructive text-destructive-foreground text-xs font-medium',
            className
          )}
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
