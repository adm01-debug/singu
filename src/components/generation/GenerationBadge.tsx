// Generation Badge Component
// Badge visual para exibição da geração

import { cn } from '@/lib/utils';
import { GenerationType } from '@/types/generation';
import { GENERATION_PROFILES } from '@/data/generationalData';

interface GenerationBadgeProps {
  generation: GenerationType;
  showIcon?: boolean;
  showAge?: boolean;
  age?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GenerationBadge({ 
  generation, 
  showIcon = true, 
  showAge = false,
  age,
  size = 'md',
  className 
}: GenerationBadgeProps) {
  const profile = GENERATION_PROFILES[generation];
  
  if (!profile) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        profile.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span>{profile.icon}</span>}
      <span>{profile.shortName}</span>
      {showAge && age && (
        <span className="opacity-70">({age})</span>
      )}
    </span>
  );
}

export default GenerationBadge;
