import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

// ── Types ──
export interface UserGoal {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  progress_pct: number;
  goal_type: string;
  period: string;
  status: string;
  due_date?: string;
  created_at?: string;
}

export interface GoalsDashboard {
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  completion_rate: number;
  streak_days: number;
  goals_by_type: Record<string, number>;
  recent_achievements: Array<{ title: string; completed_at: string }>;
}

export interface QuotaStatus {
  quota_id: string;
  quota_name: string;
  target: number;
  achieved: number;
  percentage: number;
  remaining: number;
  period: string;
  status: string;
  projected_value?: number;
  on_track: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  score: number;
  deals_closed: number;
  revenue: number;
  badges_count: number;
  streak_days?: number;
}

export interface UserBadge {
  id: string;
  badge_name: string;
  badge_icon: string;
  description: string;
  category: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ── Hooks ──
export function useUserGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-goals', user?.id],
    queryFn: () => callExternalRpc<UserGoal[]>('get_user_goals', { p_user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 60_000,
    select: (res) => res.data ?? [],
  });
}

export function useGoalsDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals-dashboard', user?.id],
    queryFn: () => callExternalRpc<GoalsDashboard>('get_goals_dashboard', { p_user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 60_000,
    select: (res) => res.data as GoalsDashboard | null,
  });
}

export function useQuotaStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quota-status', user?.id],
    queryFn: () => callExternalRpc<QuotaStatus[]>('get_quota_status', { p_user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 60_000,
    select: (res) => res.data ?? [],
  });
}

export function useLeaderboard(period: string = 'month') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => callExternalRpc<LeaderboardEntry[]>('get_leaderboard', { p_period: period }),
    staleTime: 120_000,
    select: (res) => res.data ?? [],
  });
}

export function useUserBadges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: () => callExternalRpc<UserBadge[]>('get_user_badges', { p_user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 120_000,
    select: (res) => res.data ?? [],
  });
}

export function useCheckAndAwardBadges() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callExternalRpc('check_and_award_badges', { p_user_id: user?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-badges'] });
      qc.invalidateQueries({ queryKey: ['goals-dashboard'] });
    },
  });
}
