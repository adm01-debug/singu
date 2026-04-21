import React from 'react';
import { MessageSquare, Phone, Mail, Users, Video, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'video_call', label: 'Vídeo', icon: Video },
  { value: 'note', label: 'Nota', icon: FileText },
] as const;

interface Props {
  canais: string[];
  onChange: (next: string[]) => void;
}

export const CanaisQuickFilter = React.memo(function CanaisQuickFilter({ canais, onChange }: Props) {
  const safe = Array.isArray(canais) ? canais : [];

  const toggle = (value: string) => {
    if (safe.includes(value)) onChange(safe.filter((c) => c !== value));
    else onChange([...safe, value]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {CHANNELS.map((opt) => {
        const Icon = opt.icon;
        const active = safe.includes(opt.value);
        return (
          <Badge
            key={opt.value}
            variant={active ? 'default' : 'outline'}
            role="button"
            aria-pressed={active}
            title={opt.label}
            onClick={() => toggle(opt.value)}
            className={cn(
              'cursor-pointer gap-1 px-2 py-1 text-xs transition-colors select-none',
              !active && 'hover:bg-muted',
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{opt.label}</span>
          </Badge>
        );
      })}
    </div>
  );
});
