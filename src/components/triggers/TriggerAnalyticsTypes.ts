import { TriggerType } from '@/types/triggers';
import { TriggerResult } from '@/hooks/useTriggerHistory';

export type DISCProfile = 'D' | 'I' | 'S' | 'C';

export interface TriggerUsageWithContact {
  id: string;
  trigger_type: string;
  result: string;
  effectiveness_rating: number | null;
  used_at: string;
  contact_disc: DISCProfile | null;
}

export interface DISCTriggerStats {
  discProfile: DISCProfile;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  topTriggers: Array<{
    type: TriggerType;
    count: number;
    successRate: number;
    avgRating: number;
  }>;
}

export interface TriggerEffectiveness {
  triggerType: TriggerType;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  byDISC: Record<DISCProfile, { usages: number; successRate: number; avgRating: number }>;
}

export interface AnalyticsStats {
  totalUsages: number;
  successRate: number;
  avgRating: number;
  byDISC: Record<DISCProfile, DISCTriggerStats>;
  triggerStats: TriggerEffectiveness[];
  resultDist: {
    success: number;
    neutral: number;
    failure: number;
    pending: number;
  };
}

export const DISC_COLORS: Record<DISCProfile, string> = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(45, 93%, 47%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(221, 83%, 53%)',
};

export const DISC_BG_COLORS: Record<DISCProfile, string> = {
  D: 'bg-red-500/10 text-red-600',
  I: 'bg-amber-500/10 text-amber-600',
  S: 'bg-emerald-500/10 text-emerald-600',
  C: 'bg-blue-500/10 text-blue-600',
};

export const DISC_NAMES: Record<DISCProfile, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conforme',
};

export const RESULT_COLORS: Record<TriggerResult, string> = {
  success: 'hsl(142, 76%, 36%)',
  neutral: 'hsl(215, 16%, 47%)',
  failure: 'hsl(0, 84%, 60%)',
  pending: 'hsl(45, 93%, 47%)',
};

// Custom Tooltip
export const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number | string; color: string; dataKey?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>{' '}
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.dataKey?.includes('Rate') || entry.dataKey?.includes('rating') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
