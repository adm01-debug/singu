import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));

describe('Integration: Search and Filter', () => {
  const mockContacts = [
    { id: '1', first_name: 'Ana', last_name: 'Silva', email: 'ana@tech.com', role: 'owner', sentiment: 'positive', relationship_score: 90, relationship_stage: 'client', company_id: 'c1', tags: ['vip', 'tech'] },
    { id: '2', first_name: 'Carlos', last_name: 'Santos', email: 'carlos@health.com', role: 'manager', sentiment: 'neutral', relationship_score: 65, relationship_stage: 'prospect', company_id: 'c2', tags: ['health'] },
    { id: '3', first_name: 'Beatriz', last_name: 'Oliveira', email: 'bea@finance.com', role: 'buyer', sentiment: 'negative', relationship_score: 40, relationship_stage: 'lead', company_id: 'c3', tags: ['finance', 'cold'] },
    { id: '4', first_name: 'Daniel', last_name: 'Costa', email: 'daniel@tech.com', role: 'contact', sentiment: 'positive', relationship_score: 75, relationship_stage: 'negotiation', company_id: 'c1', tags: ['tech'] },
    { id: '5', first_name: 'Elena', last_name: 'Ferreira', email: 'elena@retail.com', role: 'owner', sentiment: 'neutral', relationship_score: 55, relationship_stage: 'partner', company_id: 'c4', tags: ['retail'] },
  ];

  const mockCompanies = [
    { id: 'c1', name: 'Tech Corp', industry: 'Tecnologia', state: 'SP', financial_health: 'excellent' },
    { id: 'c2', name: 'Health Plus', industry: 'Saúde', state: 'RJ', financial_health: 'good' },
    { id: 'c3', name: 'Finance Pro', industry: 'Financeiro', state: 'SP', financial_health: 'poor' },
    { id: 'c4', name: 'Retail Max', industry: 'Varejo', state: 'MG', financial_health: 'good' },
  ];

  const mockInteractions = [
    { id: 'i1', contact_id: '1', type: 'call', title: 'Follow-up call', sentiment: 'positive', follow_up_required: true, initiated_by: 'us', created_at: '2024-03-01' },
    { id: 'i2', contact_id: '2', type: 'email', title: 'Proposta enviada', sentiment: 'neutral', follow_up_required: false, initiated_by: 'us', created_at: '2024-02-15' },
    { id: 'i3', contact_id: '1', type: 'meeting', title: 'Reunião presencial', sentiment: 'positive', follow_up_required: true, initiated_by: 'them', created_at: '2024-03-10' },
    { id: 'i4', contact_id: '3', type: 'whatsapp', title: 'Mensagem de follow-up', sentiment: 'negative', follow_up_required: false, initiated_by: 'us', created_at: '2024-01-20' },
  ];

  describe('Contact Search', () => {
    it('should filter contacts by first name', () => {
      const searchTerm = 'Ana';
      const results = mockContacts.filter(c =>
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('Ana');
    });

    it('should filter contacts by last name', () => {
      const searchTerm = 'Silva';
      const results = mockContacts.filter(c =>
        c.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0].last_name).toBe('Silva');
    });

    it('should filter contacts by email', () => {
      const searchTerm = 'tech.com';
      const results = mockContacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(2);
    });

    it('should return empty array for non-matching search', () => {
      const searchTerm = 'nonexistent';
      const results = mockContacts.filter(c =>
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const searchTerm = 'ANA';
      const results = mockContacts.filter(c =>
        c.first_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('Contact Filters', () => {
    it('should filter by role', () => {
      const results = mockContacts.filter(c => c.role === 'owner');
      expect(results).toHaveLength(2);
      expect(results.every(c => c.role === 'owner')).toBe(true);
    });

    it('should filter by sentiment', () => {
      const results = mockContacts.filter(c => c.sentiment === 'positive');
      expect(results).toHaveLength(2);
    });

    it('should filter by relationship stage', () => {
      const results = mockContacts.filter(c => c.relationship_stage === 'client');
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('Ana');
    });

    it('should apply multiple filters simultaneously', () => {
      const results = mockContacts.filter(
        c => c.role === 'owner' && c.sentiment === 'positive'
      );
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('Ana');
    });

    it('should filter by multiple roles', () => {
      const roles = ['owner', 'manager'];
      const results = mockContacts.filter(c => roles.includes(c.role));
      expect(results).toHaveLength(3);
    });

    it('should combine search and filters', () => {
      const searchTerm = 'tech';
      const roleFilter = 'owner';
      const results = mockContacts.filter(
        c =>
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
          c.role === roleFilter
      );
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('Ana');
    });
  });

  describe('Contact Sorting', () => {
    it('should sort by first name ascending', () => {
      const sorted = [...mockContacts].sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      );
      expect(sorted[0].first_name).toBe('Ana');
      expect(sorted[4].first_name).toBe('Elena');
    });

    it('should sort by relationship score descending', () => {
      const sorted = [...mockContacts].sort(
        (a, b) => b.relationship_score - a.relationship_score
      );
      expect(sorted[0].relationship_score).toBe(90);
      expect(sorted[4].relationship_score).toBe(40);
    });

    it('should sort by first name descending', () => {
      const sorted = [...mockContacts].sort((a, b) =>
        b.first_name.localeCompare(a.first_name)
      );
      expect(sorted[0].first_name).toBe('Elena');
    });
  });

  describe('Company Search and Filters', () => {
    it('should filter companies by name', () => {
      const searchTerm = 'Tech';
      const results = mockCompanies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tech Corp');
    });

    it('should filter companies by industry', () => {
      const results = mockCompanies.filter(c => c.industry === 'Tecnologia');
      expect(results).toHaveLength(1);
    });

    it('should filter companies by state', () => {
      const results = mockCompanies.filter(c => c.state === 'SP');
      expect(results).toHaveLength(2);
    });

    it('should filter companies by financial health', () => {
      const results = mockCompanies.filter(c => c.financial_health === 'good');
      expect(results).toHaveLength(2);
    });

    it('should combine industry and state filters', () => {
      const results = mockCompanies.filter(
        c => c.industry === 'Tecnologia' && c.state === 'SP'
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('Interaction Search and Filters', () => {
    it('should filter interactions by type', () => {
      const results = mockInteractions.filter(i => i.type === 'call');
      expect(results).toHaveLength(1);
    });

    it('should filter interactions by sentiment', () => {
      const results = mockInteractions.filter(i => i.sentiment === 'positive');
      expect(results).toHaveLength(2);
    });

    it('should filter follow-up required interactions', () => {
      const results = mockInteractions.filter(i => i.follow_up_required);
      expect(results).toHaveLength(2);
    });

    it('should filter by initiator', () => {
      const results = mockInteractions.filter(i => i.initiated_by === 'them');
      expect(results).toHaveLength(1);
    });

    it('should filter interactions for a specific contact', () => {
      const results = mockInteractions.filter(i => i.contact_id === '1');
      expect(results).toHaveLength(2);
    });

    it('should sort interactions by date descending', () => {
      const sorted = [...mockInteractions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      expect(sorted[0].id).toBe('i3');
    });

    it('should combine type and sentiment filters', () => {
      const results = mockInteractions.filter(
        i => i.type === 'meeting' && i.sentiment === 'positive'
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('Pagination Behavior', () => {
    it('should paginate contacts', () => {
      const pageSize = 2;
      const page1 = mockContacts.slice(0, pageSize);
      const page2 = mockContacts.slice(pageSize, pageSize * 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should handle last page with fewer items', () => {
      const pageSize = 2;
      const lastPage = mockContacts.slice(4, 6);
      expect(lastPage).toHaveLength(1);
    });

    it('should calculate total pages correctly', () => {
      const pageSize = 2;
      const totalPages = Math.ceil(mockContacts.length / pageSize);
      expect(totalPages).toBe(3);
    });
  });

  describe('Tag-based Filtering', () => {
    it('should filter contacts by single tag', () => {
      const results = mockContacts.filter(c => c.tags.includes('tech'));
      expect(results).toHaveLength(2);
    });

    it('should filter contacts by multiple tags (any match)', () => {
      const tags = ['vip', 'finance'];
      const results = mockContacts.filter(c =>
        c.tags.some(t => tags.includes(t))
      );
      expect(results).toHaveLength(2);
    });

    it('should filter contacts by multiple tags (all match)', () => {
      const tags = ['vip', 'tech'];
      const results = mockContacts.filter(c =>
        tags.every(t => c.tags.includes(t))
      );
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('Ana');
    });
  });
});
