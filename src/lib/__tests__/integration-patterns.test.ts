import { describe, it, expect } from 'vitest';

/**
 * Integration Pattern Tests
 * Tests for data flow patterns, state management scenarios, 
 * and edge cases in the integration between modules
 */

// ========================================
// Contact → Interaction Flow
// ========================================
describe('Contact-Interaction Data Flow', () => {
  interface MockContact {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    company_id: string | null;
    relationship_score: number;
    sentiment: string;
  }

  interface MockInteraction {
    contact_id: string;
    user_id: string;
    company_id: string | null;
    type: string;
    title: string;
    content: string;
    sentiment: string;
  }

  function createInteractionFromContact(
    contact: MockContact,
    type: string,
    content: string
  ): MockInteraction {
    return {
      contact_id: contact.id,
      user_id: contact.user_id,
      company_id: contact.company_id,
      type,
      title: `${type} com ${contact.first_name}`,
      content,
      sentiment: contact.sentiment,
    };
  }

  const contact: MockContact = {
    id: 'c-1',
    user_id: 'u-1',
    first_name: 'Maria',
    last_name: 'Silva',
    company_id: 'comp-1',
    relationship_score: 75,
    sentiment: 'positive',
  };

  it('inherits user_id from contact', () => {
    const interaction = createInteractionFromContact(contact, 'whatsapp', 'Olá');
    expect(interaction.user_id).toBe(contact.user_id);
  });

  it('inherits company_id from contact', () => {
    const interaction = createInteractionFromContact(contact, 'email', 'Proposta');
    expect(interaction.company_id).toBe(contact.company_id);
  });

  it('handles null company_id', () => {
    const noCompany = { ...contact, company_id: null };
    const interaction = createInteractionFromContact(noCompany, 'call', 'Ligação');
    expect(interaction.company_id).toBeNull();
  });

  it('generates title with contact name', () => {
    const interaction = createInteractionFromContact(contact, 'meeting', 'Reunião semanal');
    expect(interaction.title).toContain('Maria');
  });

  it('preserves content', () => {
    const content = 'Mensagem muito longa com detalhes...';
    const interaction = createInteractionFromContact(contact, 'note', content);
    expect(interaction.content).toBe(content);
  });
});

// ========================================
// Auto-analysis trigger threshold
// ========================================
describe('Auto-Analysis Trigger Logic', () => {
  const MIN_CHARS_FOR_ANALYSIS = 100;

  function shouldTriggerAnalysis(content: string): boolean {
    return content.length >= MIN_CHARS_FOR_ANALYSIS;
  }

  it('triggers at exactly 100 chars', () => {
    expect(shouldTriggerAnalysis('A'.repeat(100))).toBe(true);
  });

  it('does not trigger at 99 chars', () => {
    expect(shouldTriggerAnalysis('A'.repeat(99))).toBe(false);
  });

  it('triggers at 200 chars', () => {
    expect(shouldTriggerAnalysis('A'.repeat(200))).toBe(true);
  });

  it('does not trigger for empty string', () => {
    expect(shouldTriggerAnalysis('')).toBe(false);
  });

  it('does not trigger for short greetings', () => {
    expect(shouldTriggerAnalysis('Oi, tudo bem?')).toBe(false);
  });

  it('triggers for detailed message', () => {
    const msg = 'Bom dia, gostaria de discutir sobre a proposta que enviamos na semana passada. Temos algumas questões sobre o prazo e condições de pagamento que precisam ser esclarecidas antes de seguir.';
    expect(shouldTriggerAnalysis(msg)).toBe(true);
  });
});

// ========================================
// Notification Priority Logic
// ========================================
describe('Notification Priority System', () => {
  type Priority = 'critical' | 'high' | 'medium' | 'low';

  function getNotificationPriority(params: {
    type: string;
    healthScore?: number;
    daysOverdue?: number;
  }): Priority {
    if (params.type === 'health_alert' && (params.healthScore ?? 100) < 30) return 'critical';
    if (params.type === 'health_alert' && (params.healthScore ?? 100) < 50) return 'high';
    if (params.daysOverdue && params.daysOverdue > 14) return 'high';
    if (params.daysOverdue && params.daysOverdue > 7) return 'medium';
    return 'low';
  }

  it('critical for health score below 30', () => {
    expect(getNotificationPriority({ type: 'health_alert', healthScore: 20 })).toBe('critical');
  });

  it('high for health score below 50', () => {
    expect(getNotificationPriority({ type: 'health_alert', healthScore: 45 })).toBe('high');
  });

  it('high for 15+ days overdue', () => {
    expect(getNotificationPriority({ type: 'cadence', daysOverdue: 15 })).toBe('high');
  });

  it('medium for 8-14 days overdue', () => {
    expect(getNotificationPriority({ type: 'cadence', daysOverdue: 10 })).toBe('medium');
  });

  it('low for recent contacts', () => {
    expect(getNotificationPriority({ type: 'cadence', daysOverdue: 3 })).toBe('low');
  });

  it('low for non-alert types', () => {
    expect(getNotificationPriority({ type: 'info' })).toBe('low');
  });

  it('boundary: exactly 30 health score is high not critical', () => {
    expect(getNotificationPriority({ type: 'health_alert', healthScore: 30 })).toBe('high');
  });

  it('boundary: exactly 50 health score is low', () => {
    expect(getNotificationPriority({ type: 'health_alert', healthScore: 50 })).toBe('low');
  });
});

// ========================================
// Search & Filter Logic
// ========================================
describe('Contact Search & Filter Logic', () => {
  const contacts = [
    { id: '1', first_name: 'Ana', last_name: 'Silva', tags: ['cliente', 'vip'], relationship_stage: 'customer', sentiment: 'positive' },
    { id: '2', first_name: 'Bruno', last_name: 'Costa', tags: ['prospect'], relationship_stage: 'prospect', sentiment: 'neutral' },
    { id: '3', first_name: 'Carla', last_name: 'Oliveira', tags: ['cliente'], relationship_stage: 'at_risk', sentiment: 'negative' },
    { id: '4', first_name: 'Daniel', last_name: 'Santos', tags: [], relationship_stage: 'lost', sentiment: 'neutral' },
  ];

  function searchContacts(query: string) {
    const q = query.toLowerCase();
    return contacts.filter(c =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  function filterByStage(stage: string) {
    return contacts.filter(c => c.relationship_stage === stage);
  }

  function filterBySentiment(sentiment: string) {
    return contacts.filter(c => c.sentiment === sentiment);
  }

  it('searches by first name', () => {
    expect(searchContacts('ana').length).toBe(1);
  });

  it('searches by last name', () => {
    expect(searchContacts('silva').length).toBe(1);
  });

  it('searches by tag', () => {
    expect(searchContacts('vip').length).toBe(1);
  });

  it('searches by tag "cliente" returns 2', () => {
    expect(searchContacts('cliente').length).toBe(2);
  });

  it('case insensitive search', () => {
    expect(searchContacts('ANA').length).toBe(1);
  });

  it('empty search returns all', () => {
    expect(searchContacts('').length).toBe(4);
  });

  it('no results for gibberish', () => {
    expect(searchContacts('zzzzzzz').length).toBe(0);
  });

  it('filters by customer stage', () => {
    expect(filterByStage('customer').length).toBe(1);
  });

  it('filters by at_risk stage', () => {
    expect(filterByStage('at_risk').length).toBe(1);
  });

  it('filters by positive sentiment', () => {
    expect(filterBySentiment('positive').length).toBe(1);
  });

  it('filters by neutral sentiment', () => {
    expect(filterBySentiment('neutral').length).toBe(2);
  });
});

// ========================================
// Cadence & Reminder Logic
// ========================================
describe('Cadence & Reminder Logic', () => {
  function isOverdue(nextContactDue: string | null): boolean {
    if (!nextContactDue) return false;
    return new Date(nextContactDue) < new Date();
  }

  function daysUntilDue(nextContactDue: string | null): number | null {
    if (!nextContactDue) return null;
    const diff = new Date(nextContactDue).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getNextContactDate(lastContact: string, cadenceDays: number): string {
    const next = new Date(lastContact);
    next.setDate(next.getDate() + cadenceDays);
    return next.toISOString();
  }

  it('null due date is not overdue', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('past date is overdue', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
  });

  it('future date is not overdue', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });

  it('null due returns null days', () => {
    expect(daysUntilDue(null)).toBeNull();
  });

  it('future date returns positive days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntilDue(future.toISOString())).toBeGreaterThan(0);
  });

  it('past date returns negative days', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(daysUntilDue(past.toISOString())).toBeLessThan(0);
  });

  it('calculates next contact date correctly', () => {
    const next = getNextContactDate('2024-01-01', 30);
    expect(next).toContain('2024-01-31');
  });

  it('handles short cadence (1 day)', () => {
    const next = getNextContactDate('2024-06-15', 1);
    expect(next).toContain('2024-06-16');
  });

  it('handles long cadence (90 days)', () => {
    const next = getNextContactDate('2024-01-01', 90);
    const date = new Date(next);
    expect(date.getMonth()).toBe(2); // March (0-indexed)
  });
});

// ========================================
// Weekly Digest Aggregation
// ========================================
describe('Weekly Digest Aggregation', () => {
  function aggregateWeeklyStats(interactions: { type: string; sentiment: string }[]) {
    const byType: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};

    for (const i of interactions) {
      byType[i.type] = (byType[i.type] || 0) + 1;
      bySentiment[i.sentiment] = (bySentiment[i.sentiment] || 0) + 1;
    }

    return {
      total: interactions.length,
      byType,
      bySentiment,
      engagementScore: Math.min(100, interactions.length * 10),
    };
  }

  it('empty week', () => {
    const stats = aggregateWeeklyStats([]);
    expect(stats.total).toBe(0);
    expect(stats.engagementScore).toBe(0);
  });

  it('counts by type', () => {
    const stats = aggregateWeeklyStats([
      { type: 'whatsapp', sentiment: 'positive' },
      { type: 'whatsapp', sentiment: 'neutral' },
      { type: 'call', sentiment: 'positive' },
    ]);
    expect(stats.byType.whatsapp).toBe(2);
    expect(stats.byType.call).toBe(1);
  });

  it('counts by sentiment', () => {
    const stats = aggregateWeeklyStats([
      { type: 'email', sentiment: 'positive' },
      { type: 'email', sentiment: 'positive' },
      { type: 'email', sentiment: 'negative' },
    ]);
    expect(stats.bySentiment.positive).toBe(2);
    expect(stats.bySentiment.negative).toBe(1);
  });

  it('engagement score caps at 100', () => {
    const many = Array.from({ length: 20 }, () => ({ type: 'whatsapp', sentiment: 'neutral' }));
    const stats = aggregateWeeklyStats(many);
    expect(stats.engagementScore).toBe(100);
  });
});
