import { useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { differenceInDays, subMonths, format } from 'date-fns';

export interface StageVelocity {
  stage: string;
  stageName: string;
  averageDays: number;
  contactCount: number;
  trend: 'improving' | 'stable' | 'declining';
  benchmark: number; // industry average in days
}

export interface DealMetrics {
  averageCycleTime: number; // days from lead to customer
  totalActiveDeals: number;
  stageVelocities: StageVelocity[];
  bottleneckStage: string | null;
  fastestStage: string | null;
  monthlyTrend: { month: string; velocity: number }[];
  projectedConversions: number;
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  customer: 'Cliente',
  churned: 'Perdido'
};

const STAGE_BENCHMARKS: Record<string, number> = {
  lead: 14,
  prospect: 21,
  qualified: 14,
  proposal: 7,
  negotiation: 14,
  customer: 0,
  churned: 0
};

const STAGE_ORDER = ['lead', 'prospect', 'qualified', 'proposal', 'negotiation', 'customer'];

export function useDealVelocity() {
  const { contacts, loading: contactsLoading } = useContacts();
  const { interactions, loading: interactionsLoading } = useInteractions();

  const metrics = useMemo((): DealMetrics | null => {
    if (contactsLoading || interactionsLoading) return null;

    // Group contacts by stage
    const stageGroups: Record<string, typeof contacts> = {};
    STAGE_ORDER.forEach(stage => {
      stageGroups[stage] = [];
    });

    contacts.forEach(contact => {
      const stage = contact.relationship_stage || 'lead';
      if (stageGroups[stage]) {
        stageGroups[stage].push(contact);
      }
    });

    // Calculate time in each stage
    const stageVelocities: StageVelocity[] = [];
    let totalCycleTime = 0;
    let customerCount = 0;

    STAGE_ORDER.forEach(stage => {
      const stageContacts = stageGroups[stage];
      if (stageContacts.length === 0 && stage !== 'customer') {
        stageVelocities.push({
          stage,
          stageName: STAGE_LABELS[stage] || stage,
          averageDays: 0,
          contactCount: 0,
          trend: 'stable',
          benchmark: STAGE_BENCHMARKS[stage] || 14
        });
        return;
      }

      // Calculate average days in stage
      const daysInStage = stageContacts.map(contact => {
        const createdAt = new Date(contact.created_at);
        const updatedAt = new Date(contact.updated_at);
        return differenceInDays(updatedAt, createdAt);
      });

      const avgDays = daysInStage.length > 0
        ? Math.round(daysInStage.reduce((a, b) => a + b, 0) / daysInStage.length)
        : 0;

      // Determine trend (compare recent vs older contacts)
      const recentContacts = stageContacts.filter(c => 
        differenceInDays(new Date(), new Date(c.created_at)) <= 60
      );
      const olderContacts = stageContacts.filter(c => 
        differenceInDays(new Date(), new Date(c.created_at)) > 60
      );

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentContacts.length >= 2 && olderContacts.length >= 2) {
        const recentAvg = recentContacts.reduce((acc, c) => 
          acc + differenceInDays(new Date(c.updated_at), new Date(c.created_at)), 0
        ) / recentContacts.length;
        
        const olderAvg = olderContacts.reduce((acc, c) => 
          acc + differenceInDays(new Date(c.updated_at), new Date(c.created_at)), 0
        ) / olderContacts.length;

        if (recentAvg < olderAvg * 0.8) trend = 'improving';
        else if (recentAvg > olderAvg * 1.2) trend = 'declining';
      }

      stageVelocities.push({
        stage,
        stageName: STAGE_LABELS[stage] || stage,
        averageDays: avgDays,
        contactCount: stageContacts.length,
        trend,
        benchmark: STAGE_BENCHMARKS[stage] || 14
      });

      // Track customer cycle time
      if (stage === 'customer') {
        customerCount = stageContacts.length;
        stageContacts.forEach(contact => {
          const cycleTime = differenceInDays(
            new Date(contact.updated_at),
            new Date(contact.created_at)
          );
          totalCycleTime += cycleTime;
        });
      }
    });

    // Find bottleneck (slowest stage relative to benchmark)
    const bottleneckStage = stageVelocities
      .filter(s => s.stage !== 'customer' && s.stage !== 'churned' && s.contactCount > 0)
      .reduce((worst, current) => {
        const currentRatio = current.averageDays / current.benchmark;
        const worstRatio = worst ? worst.averageDays / worst.benchmark : 0;
        return currentRatio > worstRatio ? current : worst;
      }, null as StageVelocity | null);

    // Find fastest stage
    const fastestStage = stageVelocities
      .filter(s => s.stage !== 'customer' && s.stage !== 'churned' && s.contactCount > 0)
      .reduce((best, current) => {
        if (!best) return current;
        const currentRatio = current.averageDays / current.benchmark;
        const bestRatio = best.averageDays / best.benchmark;
        return currentRatio < bestRatio ? current : best;
      }, null as StageVelocity | null);

    // Monthly trend
    const monthlyTrend: { month: string; velocity: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = subMonths(new Date(), i);
      const monthContacts = contacts.filter(c => {
        const updated = new Date(c.updated_at);
        return format(updated, 'yyyy-MM') === format(monthStart, 'yyyy-MM') &&
               c.relationship_stage === 'customer';
      });

      if (monthContacts.length > 0) {
        const avgVelocity = monthContacts.reduce((acc, c) => 
          acc + differenceInDays(new Date(c.updated_at), new Date(c.created_at)), 0
        ) / monthContacts.length;
        
        monthlyTrend.push({
          month: format(monthStart, 'MMM'),
          velocity: Math.round(avgVelocity)
        });
      } else {
        monthlyTrend.push({
          month: format(monthStart, 'MMM'),
          velocity: 0
        });
      }
    }

    // Project conversions based on current pipeline
    const activeDeals = contacts.filter(c => 
      c.relationship_stage && 
      ['prospect', 'qualified', 'proposal', 'negotiation'].includes(c.relationship_stage)
    ).length;

    // Assume 30% conversion rate
    const projectedConversions = Math.round(activeDeals * 0.3);

    return {
      averageCycleTime: customerCount > 0 ? Math.round(totalCycleTime / customerCount) : 0,
      totalActiveDeals: activeDeals,
      stageVelocities,
      bottleneckStage: bottleneckStage?.stage || null,
      fastestStage: fastestStage?.stage || null,
      monthlyTrend,
      projectedConversions
    };
  }, [contacts, interactions, contactsLoading, interactionsLoading]);

  return {
    metrics,
    loading: contactsLoading || interactionsLoading
  };
}
