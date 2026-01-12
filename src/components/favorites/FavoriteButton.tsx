import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  id: string;
  type: 'contact' | 'company';
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  id,
  type,
  name,
  size = 'sm',
  variant = 'ghost',
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const favorited = isFavorite(id, type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    const wasFavorite = favorited;
    toggleFavorite({ id, type, name });
    
    // Show toast feedback
    if (!wasFavorite) {
      toast.success(`${name} adicionado aos favoritos`, {
        icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
      });
    } else {
      toast.success(`${name} removido dos favoritos`);
    }
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleClick}
      className={cn(
        'transition-all duration-200 relative overflow-hidden',
        sizeClasses[size],
        favorited && 'text-yellow-500 hover:text-yellow-600',
        !favorited && 'text-muted-foreground hover:text-yellow-500',
        className
      )}
      aria-label={favorited ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
    >
      {/* Background burst effect */}
      <AnimatePresence>
        {isAnimating && favorited && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-yellow-400/30 rounded-full"
          />
        )}
      </AnimatePresence>

      {/* Star icon with animation */}
      <motion.div
        animate={isAnimating ? { 
          scale: [1, 1.4, 0.9, 1.1, 1],
          rotate: [0, -15, 15, -5, 0],
        } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Star 
          className={cn(
            iconSizes[size],
            'transition-all duration-200',
            favorited && 'fill-current'
          )} 
        />
      </motion.div>

      {/* Sparkle particles */}
      <AnimatePresence>
        {isAnimating && favorited && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  opacity: 1,
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 20],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 20],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </Button>
  );
}

// Compact version for lists
export function FavoriteIndicator({ 
  id, 
  type 
}: { 
  id: string; 
  type: 'contact' | 'company'; 
}) {
  const { isFavorite } = useFavorites();
  const favorited = isFavorite(id, type);

  if (!favorited) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center justify-center"
    >
      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
    </motion.div>
  );
}
