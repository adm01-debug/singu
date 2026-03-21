import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeeklyReport } from '../useWeeklyReport';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' }, session: { access_token: 'test-token' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const mockSonnerToast = Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
});
vi.mock('sonner', () => ({
  toast: mockSonnerToast,
}));

const mockSupabaseFrom = vi.fn();
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: (...args: unknown[]) => mockFunctionsInvoke(...args) },
  },
}));

const fakeSettings = {
  id: 's1',
  user_id: 'test-user-123',
  enabled: true,
  send_day: 'monday',
  send_time: '09:00',
  email_address: 'test@test.com',
  include_portfolio_summary: true,
  include_at_risk_clients: true,
  include_health_alerts: true,
  include_upcoming_dates: true,
  include_recommendations: true,
  include_performance_metrics: true,
  last_sent_at: null,
};

const fakeReport = {
  id: 'r1',
  user_id: 'test-user-123',
  report_data: { generatedAt: '2025-01-01', period: { start: '2025-01-01', end: '2025-01-07' } },
  sent_via: ['dashboard'],
  created_at: '2025-01-01T00:00:00Z',
};

function setupFromMock(settingsData: any = null, reportsData: any[] = []) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'weekly_report_settings') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: settingsData, error: null }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: settingsData || fakeSettings, error: null }),
          }),
        }),
      };
    }
    if (table === 'weekly_reports') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: reportsData, error: null }),
      };
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });
}

describe('useWeeklyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFromMock();
  });

  it('should start with loading=true', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(result.current.loading).toBe(true);
  });

  it('should start with null settings', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(result.current.settings).toBeNull();
  });

  it('should start with empty reports', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(result.current.reports).toEqual([]);
  });

  it('should start with generating=false', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(result.current.generating).toBe(false);
  });

  it('should fetch settings on mount', async () => {
    setupFromMock(fakeSettings);

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.settings).toBeTruthy();
    expect(result.current.settings?.send_day).toBe('monday');
  });

  it('should fetch reports on mount', async () => {
    setupFromMock(null, [fakeReport]);

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.reports).toHaveLength(1);
  });

  it('should save settings via upsert', async () => {
    setupFromMock();

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveSettings({ send_day: 'friday' });
    });

    expect(mockSonnerToast.success).toHaveBeenCalledWith('Configurações salvas com sucesso');
  });

  it('should handle saveSettings error', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'weekly_report_settings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveSettings({ send_day: 'friday' });
    });

    expect(mockSonnerToast.error).toHaveBeenCalledWith('Erro ao salvar configurações');
  });

  it('should generate report via edge function', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { digests: [{ userId: 'test-user-123', summary: 'report data' }] },
      error: null,
    });
    setupFromMock();

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const report = await result.current.generateReport();
      expect(report).toBeTruthy();
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('weekly-digest', {
      body: { userId: 'test-user-123', generateOnly: true },
    });
    expect(mockSonnerToast.success).toHaveBeenCalled();
  });

  it('should set generating=true during report generation', async () => {
    let resolveInvoke: any;
    mockFunctionsInvoke.mockReturnValue(new Promise(r => { resolveInvoke = r; }));
    setupFromMock();

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let generatePromise: Promise<any>;
    act(() => {
      generatePromise = result.current.generateReport();
    });

    expect(result.current.generating).toBe(true);

    await act(async () => {
      resolveInvoke({ data: { digests: [] }, error: null });
      await generatePromise!;
    });

    expect(result.current.generating).toBe(false);
  });

  it('should handle generateReport error', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    setupFromMock();

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const report = await result.current.generateReport();
      expect(report).toBeNull();
    });

    expect(mockSonnerToast.error).toHaveBeenCalled();
  });

  it('should send test email', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: null });
    setupFromMock(fakeSettings);

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendTestEmail();
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('weekly-digest', {
      body: { userId: 'test-user-123', sendEmail: true, testMode: true },
    });
  });

  it('should show error when sending test email without email configured', async () => {
    setupFromMock({ ...fakeSettings, email_address: null });

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Settings is loaded but email_address is null
    await act(async () => {
      await result.current.sendTestEmail();
    });

    expect(mockSonnerToast.error).toHaveBeenCalledWith('Configure um email primeiro');
  });

  it('should expose dayOptions', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(result.current.dayOptions).toHaveLength(7);
    expect(result.current.dayOptions[0].value).toBe('monday');
  });

  it('should expose refreshSettings and refreshReports', () => {
    const { result } = renderHook(() => useWeeklyReport());
    expect(typeof result.current.refreshSettings).toBe('function');
    expect(typeof result.current.refreshReports).toBe('function');
  });

  it('should show info toast when no digest found for user', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { digests: [{ userId: 'other-user' }] },
      error: null,
    });
    setupFromMock();

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generateReport();
    });

    expect(mockSonnerToast.info).toHaveBeenCalled();
  });

  it('should handle send test email error', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    setupFromMock(fakeSettings);

    const { result } = renderHook(() => useWeeklyReport());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendTestEmail();
    });

    expect(mockSonnerToast.error).toHaveBeenCalled();
  });
});
