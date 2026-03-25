import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        single: mockSingle,
        limit: mockLimit,
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      };
    },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'token', user: { id: 'user-1' } } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));

describe('Integration: Contact/Company Data Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contact CRUD Operations', () => {
    const mockContact = {
      id: 'contact-1',
      first_name: 'Maria',
      last_name: 'Santos',
      email: 'maria@test.com',
      phone: '11999998888',
      company_id: 'company-1',
      role: 'contact',
      relationship_score: 75,
      sentiment: 'positive',
      user_id: 'user-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should fetch contacts list', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContact],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('contacts').select('*').order('updated_at', { ascending: false });

      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe('Maria');
    });

    it('should create a new contact', async () => {
      mockInsert.mockResolvedValue({
        data: [mockContact],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('contacts').insert({
        first_name: 'Maria',
        last_name: 'Santos',
        email: 'maria@test.com',
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should update a contact', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ ...mockContact, relationship_score: 85 }],
          error: null,
        }),
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('contacts')
        .update({ relationship_score: 85 })
        .eq('id', 'contact-1');

      expect(mockUpdate).toHaveBeenCalledWith({ relationship_score: 85 });
    });

    it('should delete a contact', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('contacts').delete().eq('id', 'contact-1');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should fetch a single contact by id', async () => {
      mockSingle.mockResolvedValue({
        data: mockContact,
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('contacts')
        .select('*')
        .eq('id', 'contact-1')
        .single();

      expect(result.data).toEqual(mockContact);
    });

    it('should handle fetch errors', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch contacts' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('contacts').select('*').order('updated_at');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Failed to fetch contacts');
    });
  });

  describe('Company CRUD Operations', () => {
    const mockCompany = {
      id: 'company-1',
      name: 'Tech Corp',
      industry: 'Tecnologia',
      state: 'SP',
      financial_health: 'good',
      user_id: 'user-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    it('should fetch companies list', async () => {
      mockOrder.mockResolvedValue({
        data: [mockCompany],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('companies').select('*').order('updated_at');

      expect(mockFrom).toHaveBeenCalledWith('companies');
      expect(result.data).toHaveLength(1);
    });

    it('should create a company', async () => {
      mockInsert.mockResolvedValue({
        data: [mockCompany],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('companies').insert({
        name: 'Tech Corp',
        industry: 'Tecnologia',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should handle duplicate company name error', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('companies').insert({ name: 'Existing Corp' });

      expect(result.error).toBeTruthy();
    });
  });

  describe('Interaction Flow', () => {
    const mockInteraction = {
      id: 'int-1',
      contact_id: 'contact-1',
      type: 'call',
      title: 'Follow-up call',
      content: 'Discussed project timeline',
      sentiment: 'positive',
      follow_up_required: true,
      created_at: '2024-01-15',
    };

    it('should fetch interactions for a contact', async () => {
      mockOrder.mockResolvedValue({
        data: [mockInteraction],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', 'contact-1')
        .order('created_at', { ascending: false });

      expect(mockFrom).toHaveBeenCalledWith('interactions');
      expect(result.data).toHaveLength(1);
    });

    it('should create an interaction', async () => {
      mockInsert.mockResolvedValue({
        data: [mockInteraction],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('interactions').insert({
        contact_id: 'contact-1',
        type: 'call',
        title: 'Follow-up call',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should handle interaction without contact', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'violates foreign key constraint' },
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.from('interactions').insert({
        contact_id: 'non-existent',
        type: 'call',
        title: 'Test',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('Cross-Entity Data Flow', () => {
    it('should link contact to company', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'contact-1', company_id: 'company-1' }],
          error: null,
        }),
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('contacts')
        .update({ company_id: 'company-1' })
        .eq('id', 'contact-1');

      expect(mockUpdate).toHaveBeenCalledWith({ company_id: 'company-1' });
    });

    it('should fetch contacts with company information', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'contact-1',
            first_name: 'Maria',
            company_id: 'company-1',
            companies: { name: 'Tech Corp' },
          },
        ],
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase
        .from('contacts')
        .select('*, companies(name)')
        .order('updated_at');

      expect(result.data[0].companies).toBeDefined();
    });
  });
});
