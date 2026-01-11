import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ============================================
// PULL TO REFRESH - Pilar 5.3
// ============================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80, 
  disabled = false,
  className 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    if (info.offset.y >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const canPull = !disabled && !isRefreshing;

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Refresh Indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{ 
          y: useTransform(y, (value) => Math.min(value - 40, threshold - 40)),
          opacity,
          scale
        }}
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : rotate }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
          className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={canPull ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? threshold / 2 : y }}
        animate={isRefreshing ? { y: threshold / 2 } : undefined}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// SWIPE BACK GESTURE - Pilar 5.3
// ============================================

interface SwipeBackProps {
  children: ReactNode;
  onBack?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeBack({ children, onBack, threshold = 100, className }: SwipeBackProps) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, threshold], [1, 0.5]);
  const indicatorOpacity = useTransform(x, [0, 20, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(x, [0, threshold], [0.5, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x >= threshold) {
      if (onBack) {
        onBack();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Back Indicator */}
      <motion.div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 md:hidden"
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
      >
        <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg">
          <ArrowLeft className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.3 }}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className="touch-pan-y md:touch-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// FLOATING ACTION BUTTON - Pilar 5.3
// ============================================

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  className?: string;
  showOnMobile?: boolean;
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right',
  className,
  showOnMobile = true
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'right-4 bottom-24 md:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-24 md:bottom-6',
    'bottom-left': 'left-4 bottom-24 md:bottom-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const variantClasses = {
    primary: 'bg-gradient-primary text-white shadow-glow hover:shadow-xl',
    secondary: 'bg-card text-foreground border border-border shadow-lg hover:bg-muted'
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed z-40 rounded-full flex items-center justify-center transition-shadow",
        positionClasses[position],
        sizeClasses[size],
        variantClasses[variant],
        !showOnMobile && "hidden md:flex",
        className
      )}
    >
      <span className={iconSizeClasses[size]}>{icon}</span>
    </motion.button>
  );
}

// ============================================
// EXPANDABLE FAB - Multiple Actions
// ============================================

interface FabAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface ExpandableFabProps {
  mainIcon: ReactNode;
  actions: FabAction[];
  label: string;
  className?: string;
}

export function ExpandableFab({ mainIcon, actions, label, className }: ExpandableFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed right-4 bottom-24 md:bottom-6 z-40", className)}>
      {/* Actions */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        className="absolute bottom-16 right-0 flex flex-col items-end gap-3"
      >
        {actions.map((action, index) => (
          <motion.div
            key={index}
            variants={{
              open: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { delay: index * 0.05 }
              },
              closed: { 
                opacity: 0, 
                y: 20, 
                scale: 0.8 
              }
            }}
            className="flex items-center gap-2"
          >
            <span className="px-3 py-1.5 rounded-lg bg-card text-sm font-medium text-foreground shadow-md whitespace-nowrap">
              {action.label}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-card text-foreground shadow-lg flex items-center justify-center border border-border"
            >
              {action.icon}
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={label}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-full bg-gradient-primary text-white shadow-glow flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {mainIcon}
        </motion.div>
      </motion.button>
    </div>
  );
}
