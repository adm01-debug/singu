import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MiniCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  variant?: 'success' | 'star' | 'sparkle';
  position?: { x: number; y: number };
}

const variants = {
  success: {
    icon: Check,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    particles: ['#10B981', '#34D399', '#6EE7B7'],
  },
  star: {
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    particles: ['#F59E0B', '#FBBF24', '#FCD34D'],
  },
  sparkle: {
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500',
    particles: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
  },
};

const MiniCelebration = ({ 
  show, 
  onComplete, 
  variant = 'success',
  position 
}: MiniCelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; color: string }>>([]);
  const config = variants[variant];
  const Icon = config.icon;
  
  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: i * 45,
        color: config.particles[i % config.particles.length],
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, config.particles]);
  
  if (!position) return null;
  
  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: position.x, top: position.y }}
        >
          {/* Central icon burst */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.5, 1], rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${config.color}`}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
          
          {/* Particle burst */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                scale: [0, 1, 0.5],
                x: Math.cos(particle.angle * Math.PI / 180) * 40,
                y: Math.sin(particle.angle * Math.PI / 180) * 40,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: particle.color }}
              />
            </motion.div>
          ))}
          
          {/* Ring expansion */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 ${config.color.replace('text-', 'border-')}`}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default MiniCelebration;
