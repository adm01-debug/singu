import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberStats {
  id: string;
  name: string;
  role: string;
  contacts_count: number;
  interactions_this_month: number;
  deals_count: number;
  avg_sentiment: string;
  is_on_vacation: boolean;
}

export function useTeamDashboard() {
  return useQuery({
    queryKey: ['team-dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { members: [], isManager: false };

      // Check if user is a manager
      const { data: managedMembers } = await supabase
        .from('sales_team_members')
        .select('id, name, role, is_on_vacation, user_id, manager_id')
        .order('name');

      if (!managedMembers?.length) return { members: [], isManager: false };

      // Find if current user is a manager
      const currentMember = managedMembers.find(m => m.user_id === user.id);
      if (!currentMember) return { members: [], isManager: false };

      const teamMembers = managedMembers.filter(
        m => (m as any).manager_id === currentMember.id || m.user_id === user.id
      );

      if (teamMembers.length <= 1) {
        // Not a manager or no reports — show all for admin
        const isAdmin = await checkAdmin(user.id);
        if (!isAdmin) return { members: [], isManager: false };
        // Admin sees all
        return { members: await enrichMembers(managedMembers), isManager: true };
      }

      return { members: await enrichMembers(teamMembers), isManager: true };
    },
    staleTime: 5 * 60_000,
  });
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  return !!data;
}

async function enrichMembers(members: any[]): Promise<TeamMemberStats[]> {
  const userIds = members.map(m => m.user_id).filter(Boolean);
  if (!userIds.length) return members.map(m => ({
    id: m.id, name: m.name, role: m.role || 'vendedor',
    contacts_count: 0, interactions_this_month: 0, deals_count: 0,
    avg_sentiment: 'neutral', is_on_vacation: m.is_on_vacation || false,
  }));

  // Get contact counts per user
  const contactCounts = new Map<string, number>();
  const interactionCounts = new Map<string, number>();

  for (const uid of userIds) {
    const { count: cc } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', uid);
    contactCounts.set(uid, cc || 0);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const { count: ic } = await supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', monthAgo.toISOString());
    interactionCounts.set(uid, ic || 0);
  }

  return members.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role || 'vendedor',
    contacts_count: contactCounts.get(m.user_id) || 0,
    interactions_this_month: interactionCounts.get(m.user_id) || 0,
    deals_count: 0,
    avg_sentiment: 'neutral',
    is_on_vacation: m.is_on_vacation || false,
  }));
}
