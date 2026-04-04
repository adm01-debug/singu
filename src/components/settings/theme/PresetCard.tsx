import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkinPreset } from './presets';

interface PresetCardProps {
  preset: SkinPreset;
  isActive: boolean;
  onSelect: (preset: SkinPreset) => void;
}

export const PresetCard = memo(function PresetCard({ preset, isActive, onSelect }: PresetCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(preset)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left w-full',
        isActive
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-border hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      {/* Color preview swatch */}
      <div className="flex gap-1 w-full">
        <div
          className="h-8 flex-1 rounded-l-lg"
          style={{ background: preset.preview[0] }}
        />
        <div
          className="h-8 flex-1 rounded-r-lg"
          style={{ background: preset.preview[1] }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-base">{preset.emoji}</span>
        <span className="font-medium text-sm">{preset.name}</span>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Check className="w-4 h-4 text-primary" />
          </motion.div>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{preset.description}</p>
    </motion.button>
  );
});
