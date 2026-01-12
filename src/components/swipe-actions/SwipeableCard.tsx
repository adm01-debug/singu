import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Phone, Mail, Star, Trash2, Archive, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

const defaultLeftActions: SwipeAction[] = [
  {
    id: 'call',
    icon: Phone,
    label: 'Ligar',
    color: 'text-white',
    bgColor: 'bg-success',
    onAction: () => {},
  },
  {
    id: 'email',
    icon: Mail,
    label: 'Email',
    color: 'text-white',
    bgColor: 'bg-info',
    onAction: () => {},
  },
];

const defaultRightActions: SwipeAction[] = [
  {
    id: 'favorite',
    icon: Star,
    label: 'Favorito',
    color: 'text-white',
    bgColor: 'bg-warning',
    onAction: () => {},
  },
  {
    id: 'archive',
    icon: Archive,
    label: 'Arquivar',
    color: 'text-white',
    bgColor: 'bg-muted-foreground',
    onAction: () => {},
  },
  {
    id: 'delete',
    icon: Trash2,
    label: 'Excluir',
    color: 'text-white',
    bgColor: 'bg-destructive',
    onAction: () => {},
  },
];

export function SwipeableCard({
  children,
  leftActions = defaultLeftActions,
  rightActions = defaultRightActions,
  className,
  threshold = 100,
  disabled = false,
}: SwipeableCardProps) {
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Calculate opacity for actions based on drag distance
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);

  // Scale effect for the active action
  const leftScale = useTransform(x, [0, threshold, threshold * 1.5], [0.8, 1, 1.1]);
  const rightScale = useTransform(x, [-threshold * 1.5, -threshold, 0], [1.1, 1, 0.8]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const dragDistance = info.offset.x;
    
    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0 && leftActions.length > 0) {
        // Trigger first left action
        leftActions[0].onAction();
        setActiveAction(leftActions[0].id);
      } else if (dragDistance < 0 && rightActions.length > 0) {
        // Trigger last right action (usually delete)
        rightActions[rightActions.length - 1].onAction();
        setActiveAction(rightActions[rightActions.length - 1].id);
      }
    }

    // Reset after action
    setTimeout(() => setActiveAction(null), 300);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden', className)}>
      {/* Left Actions Background */}
      <motion.div
        className="absolute inset-y-0 left-0 flex items-center px-4"
        style={{ opacity: leftOpacity }}
      >
        <div className="flex items-center gap-2">
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                style={{ scale: leftScale }}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-full',
                  action.bgColor,
                  activeAction === action.id && 'ring-2 ring-white'
                )}
              >
                <Icon className={cn('w-5 h-5', action.color)} />
                <span className={cn('text-[10px] mt-0.5', action.color)}>
                  {action.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Right Actions Background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center px-4"
        style={{ opacity: rightOpacity }}
      >
        <div className="flex items-center gap-2">
          {rightActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                style={{ scale: rightScale }}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-full',
                  action.bgColor,
                  activeAction === action.id && 'ring-2 ring-white'
                )}
              >
                <Icon className={cn('w-5 h-5', action.color)} />
                <span className={cn('text-[10px] mt-0.5', action.color)}>
                  {action.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -threshold * 1.5, right: threshold * 1.5 }}
        dragElastic={0.2}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative bg-card',
          isDragging && 'cursor-grabbing'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for swipe actions
export function useSwipeActions() {
  const [actions, setActions] = useState({
    onCall: () => {},
    onEmail: () => {},
    onFavorite: () => {},
    onArchive: () => {},
    onDelete: () => {},
  });

  const createLeftActions = (handlers: Partial<typeof actions>): SwipeAction[] => [
    {
      id: 'call',
      icon: Phone,
      label: 'Ligar',
      color: 'text-white',
      bgColor: 'bg-success',
      onAction: handlers.onCall || (() => {}),
    },
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      color: 'text-white',
      bgColor: 'bg-info',
      onAction: handlers.onEmail || (() => {}),
    },
  ];

  const createRightActions = (handlers: Partial<typeof actions>): SwipeAction[] => [
    {
      id: 'favorite',
      icon: Star,
      label: 'Favorito',
      color: 'text-white',
      bgColor: 'bg-warning',
      onAction: handlers.onFavorite || (() => {}),
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Excluir',
      color: 'text-white',
      bgColor: 'bg-destructive',
      onAction: handlers.onDelete || (() => {}),
    },
  ];

  return { createLeftActions, createRightActions };
}
