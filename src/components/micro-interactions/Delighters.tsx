import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Trophy, Star, Heart, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Confetti burst for achievements
interface ConfettiBurstProps {
  trigger: boolean;
  colors?: string[];
  particleCount?: number;
}

export function ConfettiBurst({ 
  trigger, 
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
  particleCount = 100,
}: ConfettiBurstProps) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });
    }
  }, [trigger, colors, particleCount]);
  
  return null;
}

// Celebration confetti for big achievements
export function CelebrationConfetti({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (trigger) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2,
          },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F093FB'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [trigger]);

  return null;
}

// Haptic feedback wrapper
interface HapticButtonProps extends React.ComponentProps<typeof Button> {
  pattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export function HapticButton({ children, pattern = 'light', onClick, ...props }: HapticButtonProps) {
  const { vibrate } = useHapticFeedback();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    vibrate(pattern);
    onClick?.(e);
  };
  
  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  );
}

// Progress ring with glow
interface GlowingProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  glowColor?: string;
  showPercentage?: boolean;
  className?: string;
}

export function GlowingProgressRing({ 
  value, 
  max = 100, 
  size = 80, 
  strokeWidth = 8,
  glowColor = 'hsl(var(--primary))',
  showPercentage = true,
  className,
}: GlowingProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div 
        className="absolute inset-0 blur-xl opacity-30 rounded-full"
        style={{ backgroundColor: glowColor }}
      />
      
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Center content */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
    </div>
  );
}

// Typing indicator
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 px-3 py-2", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-muted-foreground rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Success animation
interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onAnimationComplete={() => setTimeout(onComplete, 500)}
          className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement badge popup
interface AchievementPopupProps {
  show: boolean;
  title: string;
  description: string;
  icon?: 'trophy' | 'star' | 'heart' | 'zap' | 'sparkles';
  onClose?: () => void;
}

export function AchievementPopup({ show, title, description, icon = 'trophy', onClose }: AchievementPopupProps) {
  const iconMap = {
    trophy: Trophy,
    star: Star,
    heart: Heart,
    zap: Zap,
    sparkles: Sparkles,
  };
  
  const Icon = iconMap[icon];

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose?.(), 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-white/90">{description}</p>
            </div>
          </div>
          <CelebrationConfetti trigger={show} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pulse effect component
export function PulseEffect({ 
  children, 
  pulse = false, 
  color = 'hsl(var(--primary))',
  className,
}: { 
  children: React.ReactNode; 
  pulse?: boolean; 
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {pulse && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.5, 2], opacity: [0.4, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.3, 1.6], opacity: [0.4, 0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
      {children}
    </div>
  );
}

// Shimmer text effect
export function ShimmerText({ 
  children, 
  className,
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <span 
      className={cn(
        "relative inline-block bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer",
        className
      )}
      style={{
        animation: 'shimmer 2s linear infinite',
      }}
    >
      {children}
    </span>
  );
}

// Floating particles
export function FloatingParticles({ 
  count = 20, 
  className,
}: { 
  count?: number; 
  className?: string;
}) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default {
  ConfettiBurst,
  CelebrationConfetti,
  HapticButton,
  GlowingProgressRing,
  TypingIndicator,
  SuccessAnimation,
  AchievementPopup,
  PulseEffect,
  ShimmerText,
  FloatingParticles,
};
