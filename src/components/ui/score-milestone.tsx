import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Milestone {
  threshold: number;
  label: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
}

const MILESTONES: Milestone[] = [
  { threshold: 20, label: 'Conhecido', icon: Star, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  { threshold: 40, label: 'Engajado', icon: Flame, color: 'text-warning', bgColor: 'bg-warning/10' },
  { threshold: 60, label: 'Confiável', icon: TrendingUp, color: 'text-info', bgColor: 'bg-info/10' },
  { threshold: 80, label: 'Parceiro', icon: Trophy, color: 'text-success', bgColor: 'bg-success/10' },
  { threshold: 95, label: 'Campeão', icon: Crown, color: 'text-primary', bgColor: 'bg-primary/10' },
];

function getMilestone(score: number): Milestone {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (score >= MILESTONES[i].threshold) return MILESTONES[i];
  }
  return MILESTONES[0];
}

function getNextMilestone(score: number): Milestone | null {
  for (const m of MILESTONES) {
    if (score < m.threshold) return m;
  }
  return null;
}

interface ScoreMilestoneProps {
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function ScoreMilestone({ score, previousScore, size = 'md', showProgress = true, className }: ScoreMilestoneProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const milestone = getMilestone(score);
  const nextMilestone = getNextMilestone(score);
  const Icon = milestone.icon;

  // Detect milestone crossed
  useEffect(() => {
    if (previousScore !== undefined && previousScore < score) {
      const prevMilestone = getMilestone(previousScore);
      if (prevMilestone.threshold < milestone.threshold) {
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [score, previousScore, milestone.threshold]);

  const sizeConfig = {
    sm: { ring: 'w-12 h-12', text: 'text-sm', icon: 'h-3 w-3', label: 'text-[10px]' },
    md: { ring: 'w-16 h-16', text: 'text-lg', icon: 'h-4 w-4', label: 'text-xs' },
    lg: { ring: 'w-20 h-20', text: 'text-xl', icon: 'h-5 w-5', label: 'text-sm' },
  }[size];

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Score Ring with Milestone */}
      <div className="relative">
        <svg className={cn(sizeConfig.ring)} viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6"
            className="stroke-muted" />
          {/* Score ring */}
          <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="6"
            strokeLinecap="round"
            className={cn('transition-colors', milestone.color.replace('text-', 'stroke-'))}
            style={{ strokeDasharray: circumference }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('font-bold', sizeConfig.text, milestone.color)}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {score}
          </motion.span>
        </div>

        {/* Milestone icon badge */}
        <motion.div
          className={cn(
            'absolute -top-1 -right-1 rounded-full p-1',
            milestone.bgColor, milestone.color
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Icon className={sizeConfig.icon} />
        </motion.div>

        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 text-primary"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                  animate={{
                    x: Math.cos((i * 60 * Math.PI) / 180) * 40,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 40,
                    opacity: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <Sparkles className="h-3 w-3" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Milestone label */}
      <div className="text-center">
        <span className={cn('font-semibold', sizeConfig.label, milestone.color)}>
          {milestone.label}
        </span>
      </div>

      {/* Progress to next milestone */}
      {showProgress && nextMilestone && (
        <div className="w-full max-w-[120px]">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>{milestone.label}</span>
            <span>{nextMilestone.label}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', milestone.color.replace('text-', 'bg-'))}
              initial={{ width: 0 }}
              animate={{
                width: `${((score - milestone.threshold) / (nextMilestone.threshold - milestone.threshold)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
            {nextMilestone.threshold - score} pts para {nextMilestone.label}
          </p>
        </div>
      )}
    </div>
  );
}
