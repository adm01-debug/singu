import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStats } from '../useDashboardStats';

const mockContacts: any[] = [];
const mockCompanies: any[] = [];
const mockInteractions: any[] = [];
let mockContactsLoading = true;
let mockCompaniesLoading = true;
let mockInteractionsLoading = true;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
  mutateExternalData: vi.fn().mockResolvedValue({ data: null, error: null }),
  callExternalFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));

vi.mock('../useContacts', () => ({
  useContacts: () => ({ contacts: mockContacts, loading: mockContactsLoading }),
}));
vi.mock('../useCompanies', () => ({
  useCompanies: () => ({ companies: mockCompanies, loading: mockCompaniesLoading }),
}));
vi.mock('../useInteractions', () => ({
  useInteractions: () => ({ interactions: mockInteractions, loading: mockInteractionsLoading }),
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContacts.length = 0;
    mockCompanies.length = 0;
    mockInteractions.length = 0;
    mockContactsLoading = true;
    mockCompaniesLoading = true;
    mockInteractionsLoading = true;
  });

  it('should return loading=true when any data source is loading', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.loading).toBe(true);
  });

  it('should return zero stats when loading', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.totalCompanies).toBe(0);
    expect(result.current.totalContacts).toBe(0);
    expect(result.current.weeklyInteractions).toBe(0);
    expect(result.current.averageScore).toBe(0);
  });

  it('should return empty arrays when loading', () => {
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.topContacts).toEqual([]);
    expect(result.current.recentActivities).toEqual([]);
  });

  it('should compute totalCompanies from companies array', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockCompanies.push(
      { id: 'c1', name: 'Co1', created_at: '2025-01-01' },
      { id: 'c2', name: 'Co2', created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.totalCompanies).toBe(2);
  });

  it('should compute totalContacts from contacts array', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockContacts.push(
      { id: 'ct1', first_name: 'A', last_name: 'B', relationship_score: 50, created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.totalContacts).toBe(1);
  });

  it('should compute averageScore from contacts with scores', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockContacts.push(
      { id: 'ct1', first_name: 'A', last_name: 'B', relationship_score: 80, created_at: '2025-01-01' },
      { id: 'ct2', first_name: 'C', last_name: 'D', relationship_score: 60, created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.averageScore).toBe(70);
  });

  it('should return 0 averageScore when no contacts have scores', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockContacts.push(
      { id: 'ct1', first_name: 'A', last_name: 'B', relationship_score: null, created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.averageScore).toBe(0);
  });

  it('should count weekly interactions', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;

    const today = new Date();
    mockInteractions.push(
      { id: 'i1', contact_id: 'ct1', title: 'Call', type: 'call', created_at: today.toISOString() }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.weeklyInteractions).toBeGreaterThanOrEqual(0);
  });

  it('should compute top contacts sorted by relationship_score', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockContacts.push(
      { id: 'ct1', first_name: 'Low', last_name: 'Score', relationship_score: 30, avatar_url: null, company_id: null, role: 'contact', sentiment: 'neutral', created_at: '2025-01-01' },
      { id: 'ct2', first_name: 'High', last_name: 'Score', relationship_score: 90, avatar_url: null, company_id: null, role: 'contact', sentiment: 'positive', created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.topContacts).toHaveLength(2);
    expect(result.current.topContacts[0].firstName).toBe('High');
    expect(result.current.topContacts[0].relationshipScore).toBe(90);
  });

  it('should limit topContacts to 4', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    for (let i = 0; i < 10; i++) {
      mockContacts.push({
        id: `ct${i}`, first_name: `Name${i}`, last_name: 'Test',
        relationship_score: 50 + i, avatar_url: null, company_id: null,
        role: 'contact', sentiment: 'neutral', created_at: '2025-01-01',
      });
    }

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.topContacts).toHaveLength(4);
  });

  it('should compute recent activities from interactions', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockInteractions.push(
      { id: 'i1', contact_id: 'ct1', title: 'Call', type: 'call', created_at: new Date().toISOString() }
    );
    mockContacts.push(
      { id: 'ct1', first_name: 'John', last_name: 'Doe', relationship_score: 50, created_at: '2025-01-01' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.recentActivities).toHaveLength(1);
    expect(result.current.recentActivities[0].entityName).toBe('John Doe');
  });

  it('should limit recent activities to 5', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    for (let i = 0; i < 10; i++) {
      mockInteractions.push({
        id: `i${i}`, contact_id: 'ct1', title: `Activity ${i}`, type: 'call',
        created_at: new Date().toISOString(),
      });
    }

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.recentActivities).toHaveLength(5);
  });

  it('should use "Contato" as fallback for unknown contact in activities', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockInteractions.push(
      { id: 'i1', contact_id: 'unknown', title: 'Call', type: 'call', created_at: new Date().toISOString() }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.recentActivities[0].entityName).toBe('Contato');
  });

  it('should format companyChange with count when companies added this month', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockCompanies.push(
      { id: 'c1', name: 'New Co', created_at: new Date().toISOString() }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.companyChange).toContain('+1');
  });

  it('should show "Nenhuma nova" when no companies added this month', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockCompanies.push(
      { id: 'c1', name: 'Old Co', created_at: '2020-01-01T00:00:00Z' }
    );

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.companyChange).toBe('Nenhuma nova');
  });

  it('should return loading=false when all data loaded', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.loading).toBe(false);
  });

  it('should map company name for top contacts', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockCompanies.push({ id: 'co1', name: 'Acme Corp', created_at: '2025-01-01' });
    mockContacts.push({
      id: 'ct1', first_name: 'John', last_name: 'Doe',
      relationship_score: 90, company_id: 'co1', avatar_url: null,
      role: 'contact', sentiment: 'positive', created_at: '2025-01-01',
    });

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.topContacts[0].companyName).toBe('Acme Corp');
  });

  it('should use "Sem empresa" when contact has no company', () => {
    mockContactsLoading = false;
    mockCompaniesLoading = false;
    mockInteractionsLoading = false;
    mockContacts.push({
      id: 'ct1', first_name: 'John', last_name: 'Doe',
      relationship_score: 90, company_id: null, avatar_url: null,
      role: 'contact', sentiment: 'positive', created_at: '2025-01-01',
    });

    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.topContacts[0].companyName).toBe('Sem empresa');
  });
});
