import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHealthAlerts } from '../useHealthAlerts';

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
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: { alertsCreated: 0 }, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    functions: { invoke: (...args: unknown[]) => mockFunctionsInvoke(...args) },
  },
}));

const fakeAlert = {
  id: 'ha-1',
  user_id: 'test-user-123',
  contact_id: 'ct-1',
  alert_type: 'critical',
  health_score: 20,
  previous_score: 50,
  title: 'Critical Health Drop',
  description: 'Score dropped significantly',
  factors: { interactionFrequency: 1, sentimentScore: 30, engagementLevel: 20, lastInteractionDays: 45 },
  dismissed: false,
  notified_via: [],
  created_at: '2025-01-01T00:00:00Z',
  contact: { first_name: 'John', last_name: 'Doe' },
};

function setupFromMock(alertsData: any[] = [], settingsData: any = null) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'health_alerts') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: alertsData, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }
    if (table === 'health_alert_settings') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: settingsData, error: null }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: settingsData || { id: 's1', user_id: 'test-user-123' }, error: null }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
  });
}

describe('useHealthAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFromMock();
  });

  it('should start with loading=true', () => {
    const { result } = renderHook(() => useHealthAlerts());
    expect(result.current.loading).toBe(true);
  });

  it('should start with empty alerts', () => {
    const { result } = renderHook(() => useHealthAlerts());
    expect(result.current.alerts).toEqual([]);
  });

  it('should start with null settings', () => {
    const { result } = renderHook(() => useHealthAlerts());
    expect(result.current.settings).toBeNull();
  });

  it('should fetch alerts on mount', async () => {
    setupFromMock([fakeAlert]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.alerts).toHaveLength(1);
  });

  it('should separate critical and warning alerts', async () => {
    const warningAlert = { ...fakeAlert, id: 'ha-2', alert_type: 'warning' };
    setupFromMock([fakeAlert, warningAlert]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.criticalAlerts).toHaveLength(1);
    expect(result.current.warningAlerts).toHaveLength(1);
  });

  it('should fetch settings on mount', async () => {
    const fakeSettings = {
      id: 's1',
      user_id: 'test-user-123',
      email_notifications: true,
      push_notifications: true,
      critical_threshold: 30,
      warning_threshold: 50,
    };
    setupFromMock([], fakeSettings);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));

    expect(result.current.settings).toBeTruthy();
  });

  it('should dismiss a single alert', async () => {
    setupFromMock([fakeAlert]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.alerts).toHaveLength(1);

    await act(async () => {
      await result.current.dismissAlert('ha-1');
    });

    expect(result.current.alerts).toHaveLength(0);
    expect(mockSonnerToast.success).toHaveBeenCalledWith('Alerta dispensado');
  });

  it('should handle dismissAlert error', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'health_alerts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [fakeAlert], error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    });

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.dismissAlert('ha-1');
    });

    expect(mockSonnerToast.error).toHaveBeenCalledWith('Erro ao dispensar alerta');
  });

  it('should dismiss all alerts', async () => {
    setupFromMock([fakeAlert, { ...fakeAlert, id: 'ha-2' }]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.alerts).toHaveLength(2);

    await act(async () => {
      await result.current.dismissAllAlerts();
    });

    expect(result.current.alerts).toHaveLength(0);
    expect(mockSonnerToast.success).toHaveBeenCalledWith('Todos os alertas foram dispensados');
  });

  it('should save settings', async () => {
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));

    await act(async () => {
      await result.current.saveSettings({ critical_threshold: 25 });
    });

    expect(mockSonnerToast.success).toHaveBeenCalledWith('Configurações salvas');
  });

  it('should handle saveSettings error', async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'health_alert_settings') {
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

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));

    await act(async () => {
      await result.current.saveSettings({ critical_threshold: 25 });
    });

    expect(mockSonnerToast.error).toHaveBeenCalledWith('Erro ao salvar configurações');
  });

  it('should check health now via edge function', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { alertsCreated: 3 }, error: null });
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.checkHealthNow();
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('check-health-alerts');
    expect(mockSonnerToast.success).toHaveBeenCalled();
  });

  it('should show info toast when no alerts created', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { alertsCreated: 0 }, error: null });
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.checkHealthNow();
    });

    expect(mockSonnerToast.info).toHaveBeenCalled();
  });

  it('should handle checkHealthNow error', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.checkHealthNow();
    });

    expect(mockSonnerToast.error).toHaveBeenCalled();
  });

  it('should expose refreshAlerts function', async () => {
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refreshAlerts).toBe('function');
  });

  it('should handle empty alerts array', async () => {
    setupFromMock([]);

    const { result } = renderHook(() => useHealthAlerts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.criticalAlerts).toEqual([]);
    expect(result.current.warningAlerts).toEqual([]);
  });
});
