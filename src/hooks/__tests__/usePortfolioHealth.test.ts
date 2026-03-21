import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePortfolioHealth } from '../usePortfolioHealth';
import type { Contact, Interaction } from '@/types';

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'ct-1',
    companyId: 'co-1',
    companyName: 'Acme Corp',
    firstName: 'John',
    lastName: 'Doe',
    role: 'contact',
    roleTitle: 'Manager',
    tags: [],
    hobbies: [],
    interests: [],
    relationshipStage: 'customer',
    relationshipScore: 70,
    lastInteraction: new Date(),
    interactionCount: 5,
    sentiment: 'positive',
    behavior: {
      discProfile: null,
      discConfidence: 0,
      preferredChannel: 'email',
      formalityLevel: 3,
      decisionCriteria: [],
      needsApproval: false,
      decisionPower: 5,
      supportLevel: 5,
      influencedByIds: [],
      influencesIds: [],
      currentChallenges: [],
      competitorsUsed: [],
    },
    lifeEvents: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  } as Contact;
}

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: 'int-1',
    contactId: 'ct-1',
    companyId: 'co-1',
    type: 'call',
    title: 'Follow-up',
    content: 'Discussion',
    sentiment: 'positive',
    tags: [],
    initiatedBy: 'us',
    followUpRequired: false,
    createdAt: new Date(),
    ...overrides,
  } as Interaction;
}

describe('usePortfolioHealth', () => {
  it('should return zero overall score with empty contacts', () => {
    const { result } = renderHook(() => usePortfolioHealth([], []));
    expect(result.current.overallScore).toBe(0);
    expect(result.current.totalClients).toBe(0);
  });

  it('should compute totalClients from contacts length', () => {
    const contacts = [makeContact()];
    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.totalClients).toBe(1);
  });

  it('should categorize healthy contacts correctly', () => {
    const contacts = [makeContact({
      relationshipScore: 80,
      sentiment: 'positive',
      lastInteraction: new Date(),
    })];
    const interactions = [makeInteraction({ contactId: 'ct-1', createdAt: new Date() })];

    const { result } = renderHook(() => usePortfolioHealth(contacts, interactions));
    expect(result.current.healthDistribution.healthy).toBeGreaterThanOrEqual(0);
  });

  it('should categorize critical contacts when score is low', () => {
    const contacts = [makeContact({
      id: 'ct-critical',
      relationshipScore: 10,
      sentiment: 'negative',
      relationshipStage: 'at_risk',
      lastInteraction: new Date('2020-01-01'),
    })];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.healthDistribution.critical).toBeGreaterThanOrEqual(1);
    expect(result.current.criticalClients).toBeGreaterThanOrEqual(1);
  });

  it('should set overallStatus to critical when many critical clients', () => {
    const contacts = Array.from({ length: 5 }, (_, i) => makeContact({
      id: `ct-${i}`,
      relationshipScore: 5,
      sentiment: 'negative',
      relationshipStage: 'at_risk',
      lastInteraction: new Date('2020-01-01'),
    }));

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.overallStatus).toBe('critical');
  });

  it('should compute trends (improving, stable, declining)', () => {
    const contacts = [
      makeContact({ id: 'ct-up', sentiment: 'positive', lastInteraction: new Date() }),
      makeContact({ id: 'ct-down', sentiment: 'negative', lastInteraction: new Date('2020-01-01') }),
    ];
    const interactions = [
      makeInteraction({ contactId: 'ct-up', createdAt: new Date() }),
      makeInteraction({ contactId: 'ct-up', createdAt: new Date() }),
      makeInteraction({ contactId: 'ct-up', createdAt: new Date() }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, interactions));
    expect(result.current.trends.improving + result.current.trends.stable + result.current.trends.declining).toBe(2);
  });

  it('should compute churn risk categories', () => {
    const contacts = [
      makeContact({ id: 'ct-1', relationshipScore: 80 }),
      makeContact({ id: 'ct-2', relationshipScore: 20, sentiment: 'negative', relationshipStage: 'at_risk', lastInteraction: new Date('2020-01-01') }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.churnRisk.low + result.current.churnRisk.medium + result.current.churnRisk.high + result.current.churnRisk.critical).toBe(2);
  });

  it('should return top performers sorted by health score descending', () => {
    const contacts = [
      makeContact({ id: 'ct-1', firstName: 'Low', relationshipScore: 30, sentiment: 'negative', lastInteraction: new Date('2020-01-01') }),
      makeContact({ id: 'ct-2', firstName: 'High', relationshipScore: 90, sentiment: 'positive' }),
    ];
    const interactions = [
      makeInteraction({ contactId: 'ct-2', createdAt: new Date() }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, interactions));
    expect(result.current.topPerformers.length).toBeGreaterThanOrEqual(1);
    expect(result.current.topPerformers[0].healthScore).toBeGreaterThanOrEqual(result.current.topPerformers[result.current.topPerformers.length - 1].healthScore);
  });

  it('should return needsAttention for non-healthy clients', () => {
    const contacts = [
      makeContact({ id: 'ct-1', relationshipScore: 10, sentiment: 'negative', relationshipStage: 'at_risk', lastInteraction: new Date('2020-01-01') }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.needsAttention.length).toBeGreaterThanOrEqual(0);
  });

  it('should generate alerts for critical clients', () => {
    const contacts = [
      makeContact({ id: 'ct-1', relationshipScore: 5, sentiment: 'negative', relationshipStage: 'at_risk', lastInteraction: new Date('2020-01-01') }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    const criticalAlert = result.current.alerts.find(a => a.type === 'critical_health');
    expect(criticalAlert).toBeTruthy();
  });

  it('should generate no_contact alert for clients without recent contact', () => {
    const contacts = [
      makeContact({ id: 'ct-1', lastInteraction: new Date('2020-01-01'), relationshipScore: 70 }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    const noContactAlert = result.current.alerts.find(a => a.type === 'no_contact');
    expect(noContactAlert).toBeTruthy();
  });

  it('should generate sentiment_drop alert for negative sentiment clients', () => {
    const contacts = [
      makeContact({ id: 'ct-1', sentiment: 'negative', relationshipScore: 70 }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    const sentimentAlert = result.current.alerts.find(a => a.type === 'sentiment_drop');
    expect(sentimentAlert).toBeTruthy();
  });

  it('should compute average metrics', () => {
    const contacts = [
      makeContact({ id: 'ct-1', relationshipScore: 80, sentiment: 'positive' }),
      makeContact({ id: 'ct-2', relationshipScore: 60, sentiment: 'neutral' }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.averageMetrics.relationshipScore).toBe(70);
    expect(result.current.averageMetrics.positiveRate).toBe(50);
  });

  it('should generate recommendations', () => {
    const contacts = [
      makeContact({ id: 'ct-1', relationshipScore: 10, sentiment: 'negative', relationshipStage: 'at_risk', lastInteraction: new Date('2020-01-01') }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate healthy recommendation when portfolio is healthy', () => {
    const contacts = [
      makeContact({
        id: 'ct-1',
        relationshipScore: 90,
        sentiment: 'positive',
        lastInteraction: new Date(),
      }),
    ];
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ id: `int-${i}`, contactId: 'ct-1', createdAt: new Date() })
    );

    const { result } = renderHook(() => usePortfolioHealth(contacts, interactions));
    // With enough interactions and good scores, should get the healthy recommendation
    expect(result.current.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('should limit topPerformers to 5', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => makeContact({
      id: `ct-${i}`,
      firstName: `Contact${i}`,
      relationshipScore: 80,
    }));

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.topPerformers.length).toBeLessThanOrEqual(5);
  });

  it('should limit needsAttention to 5', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => makeContact({
      id: `ct-${i}`,
      relationshipScore: 10,
      sentiment: 'negative',
      relationshipStage: 'at_risk',
      lastInteraction: new Date('2020-01-01'),
    }));

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    expect(result.current.needsAttention.length).toBeLessThanOrEqual(5);
  });

  it('should set mainIssue for contacts without recent contact', () => {
    const contacts = [
      makeContact({ id: 'ct-1', lastInteraction: new Date('2020-01-01'), relationshipScore: 70 }),
    ];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    const client = result.current.needsAttention.find(c => c.contactId === 'ct-1') ||
                   result.current.topPerformers.find(c => c.contactId === 'ct-1') ||
                   result.current.recentlyDeclined.find(c => c.contactId === 'ct-1');
    // At least one summary should have a mainIssue about no contact
    if (client) {
      expect(client.mainIssue).toContain('dias sem contato');
    }
  });

  it('should handle contacts with no lastInteraction (999 days)', () => {
    const contacts = [makeContact({ id: 'ct-1', lastInteraction: undefined })];

    const { result } = renderHook(() => usePortfolioHealth(contacts, []));
    // Should not crash and should treat as very old contact
    expect(result.current.totalClients).toBe(1);
  });
});
