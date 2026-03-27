import {
  Trophy,
  Heart,
  Star,
  Sparkles,
  TrendingUp,
  Bell,
  Moon,
  AlertTriangle,
  ShieldAlert,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { RFMSegment } from '@/types/rfm';

export const SEGMENT_ICONS: Record<RFMSegment, React.ReactNode> = {
  champions: <Trophy className="h-4 w-4" />,
  loyal_customers: <Heart className="h-4 w-4" />,
  potential_loyalists: <Star className="h-4 w-4" />,
  recent_customers: <Sparkles className="h-4 w-4" />,
  promising: <TrendingUp className="h-4 w-4" />,
  needing_attention: <Bell className="h-4 w-4" />,
  about_to_sleep: <Moon className="h-4 w-4" />,
  at_risk: <AlertTriangle className="h-4 w-4" />,
  cant_lose: <ShieldAlert className="h-4 w-4" />,
  hibernating: <PauseCircle className="h-4 w-4" />,
  lost: <XCircle className="h-4 w-4" />
};

export const SEGMENT_COLORS: Record<RFMSegment, string> = {
  champions: '#10b981',
  loyal_customers: '#22c55e',
  potential_loyalists: '#06b6d4',
  recent_customers: '#3b82f6',
  promising: '#6366f1',
  needing_attention: '#eab308',
  about_to_sleep: '#f97316',
  at_risk: '#ef4444',
  cant_lose: '#dc2626',
  hibernating: '#6b7280',
  lost: '#9ca3af'
};
