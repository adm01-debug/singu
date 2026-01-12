import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Edit, Archive, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  className?: string;
  /** Actions for left swipe (reveal on right side) */
  leftActions?: SwipeAction[];
  /** Actions for right swipe (reveal on left side) */
  rightActions?: SwipeAction[];
  /** Threshold to trigger action (default: 100) */
  threshold?: number;
  /** Whether to show actions immediately or only on full swipe */
  revealOnSwipe?: boolean;
  /** Disable swipe functionality */
  disabled?: boolean;
}

const defaultLeftActions: SwipeAction[] = [
  {
    id: 'delete',
    icon: <Trash2 className="w-5 h-5" />,
    label: 'Excluir',
    color: 'text-destructive-foreground',
    bgColor: 'bg-destructive',
    onAction: () => {},
  },
];

const defaultRightActions: SwipeAction[] = [
  {
    id: 'edit',
    icon: <Edit className="w-5 h-5" />,
    label: 'Editar',
    color: 'text-primary-foreground',
    bgColor: 'bg-primary',
    onAction: () => {},
  },
  {
    id: 'archive',
    icon: <Archive className="w-5 h-5" />,
    label: 'Arquivar',
    color: 'text-warning-foreground',
    bgColor: 'bg-warning',
    onAction: () => {},
  },
];

export function SwipeableListItem({
  children,
  className,
  leftActions = defaultLeftActions,
  rightActions = defaultRightActions,
  threshold = 80,
  revealOnSwipe = true,
  disabled = false,
}: SwipeableListItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const haptic = useHapticFeedback();
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  
  // Transform opacity based on drag distance
  const leftOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, threshold], [0, 1]);
  
  // Scale for actions
  const leftScale = useTransform(x, [-threshold * 1.5, -threshold, 0], [1.1, 1, 0.8]);
  const rightScale = useTransform(x, [0, threshold, threshold * 1.5], [0.8, 1, 1.1]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Check if swipe exceeded threshold
    if (offset < -threshold || (offset < 0 && velocity < -500)) {
      if (revealOnSwipe) {
        setIsRevealed('left');
        haptic.light();
      } else if (leftActions.length > 0) {
        leftActions[0].onAction();
        haptic.medium();
      }
    } else if (offset > threshold || (offset > 0 && velocity > 500)) {
      if (revealOnSwipe) {
        setIsRevealed('right');
        haptic.light();
      } else if (rightActions.length > 0) {
        rightActions[0].onAction();
        haptic.medium();
      }
    } else {
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    haptic.medium();
    setIsRevealed(null);
  };

  const closeActions = () => {
    setIsRevealed(null);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Left actions (revealed on right swipe) */}
      <motion.div
        className="absolute inset-y-0 left-0 flex items-stretch"
        style={{ opacity: rightOpacity }}
      >
        {rightActions.map((action, index) => (
          <motion.button
            key={action.id}
            className={cn(
              'flex flex-col items-center justify-center px-4 min-w-[70px]',
              action.bgColor,
              action.color
            )}
            style={{ scale: rightScale }}
            onClick={() => handleActionClick(action)}
          >
            {action.icon}
            <span className="text-xs mt-1">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Right actions (revealed on left swipe) */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ opacity: leftOpacity }}
      >
        {leftActions.map((action) => (
          <motion.button
            key={action.id}
            className={cn(
              'flex flex-col items-center justify-center px-4 min-w-[70px]',
              action.bgColor,
              action.color
            )}
            style={{ scale: leftScale }}
            onClick={() => handleActionClick(action)}
          >
            {action.icon}
            <span className="text-xs mt-1">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Main content */}
      <motion.div
        drag={prefersReducedMotion ? false : 'x'}
        dragConstraints={{ left: -threshold * 1.5, right: threshold * 1.5 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{
          x: isRevealed === 'left' 
            ? -threshold 
            : isRevealed === 'right' 
              ? threshold 
              : 0
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'relative bg-background cursor-grab active:cursor-grabbing',
          isDragging && 'z-10'
        )}
        onClick={isRevealed ? closeActions : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeableListItem;
