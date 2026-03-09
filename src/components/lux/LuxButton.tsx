import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LuxButtonProps {
  onClick: () => void;
  loading?: boolean;
  processing?: boolean;
  variant?: 'header' | 'default';
  className?: string;
}

export function LuxButton({ onClick, loading, processing, variant = 'default', className }: LuxButtonProps) {
  const isDisabled = loading || processing;

  if (variant === 'header') {
    return (
      <Button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-violet-500/25",
          "backdrop-blur transition-all duration-300",
          processing && "animate-pulse",
          className
        )}
      >
        {isDisabled ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {processing ? 'Analisando...' : 'Lux'}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white",
        "shadow-lg shadow-violet-500/25 transition-all duration-300",
        processing && "animate-pulse",
        className
      )}
    >
      {isDisabled ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      {processing ? 'Lux analisando...' : 'Lux Intelligence'}
    </Button>
  );
}
