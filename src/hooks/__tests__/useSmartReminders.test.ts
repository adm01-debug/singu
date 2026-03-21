import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSmartReminders } from '../useSmartReminders';

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } }, error: null });
const mockFunctionsInvoke = vi.fn().mockResolvedValue({
  data: { success: true, reminders: [], summary: { total: 0, byType: { follow_up: 0, birthday: 0, decay: 0, milestone: 0 }, byPriority: { high: 0, medium: 0, low: 0 } }, aiInsights: null },
  error: null,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: () => mockGetUser(),
    },
    functions: { invoke: (...args: unknown[]) => mockFunctionsInvoke(...args) },
  },
}));

const fakeReminder = {
  id: 'rem-1',
  type: 'follow_up' as const,
  priority: 'high' as const,
  title: 'Follow up with John',
  description: 'Discuss pricing',
  contactId: 'ct-1',
  contactName: 'John Doe',
  dueDate: '2025-01-15',
  metadata: {},
};

const fakeReminders = [
  fakeReminder,
  { ...fakeReminder, id: 'rem-2', type: 'birthday' as const, priority: 'medium' as const, title: 'Birthday: Jane' },
  { ...fakeReminder, id: 'rem-3', type: 'decay' as const, priority: 'low' as const, title: 'Decay alert' },
];

describe('useSmartReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: [], summary: { total: 0, byType: { follow_up: 0, birthday: 0, decay: 0, milestone: 0 }, byPriority: { high: 0, medium: 0, low: 0 } }, aiInsights: null },
      error: null,
    });
  });

  it('should start with empty reminders', () => {
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.reminders).toEqual([]);
  });

  it('should start with isLoading=false', () => {
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.isLoading).toBe(false);
  });

  it('should start with null error', () => {
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.error).toBeNull();
  });

  it('should start with null summary', () => {
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.summary).toBeNull();
  });

  it('should start with null aiInsights', () => {
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.aiInsights).toBeNull();
  });

  it('should auto-fetch when autoFetch=true', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: 'Test insights' },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(true));

    await waitFor(() => {
      expect(result.current.reminders.length).toBeGreaterThanOrEqual(0);
    });

    expect(mockFunctionsInvoke).toHaveBeenCalled();
  });

  it('should not auto-fetch when autoFetch=false', async () => {
    renderHook(() => useSmartReminders(false));

    // Wait a tick
    await new Promise(r => setTimeout(r, 50));

    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('should fetch reminders manually', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(result.current.reminders).toHaveLength(3);
    expect(result.current.summary?.total).toBe(3);
  });

  it('should set error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(result.current.error).toBe('Usuário não autenticado');
  });

  it('should handle invoke error', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function error' },
    });

    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(result.current.error).toBeTruthy();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  it('should handle unsuccessful response', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: false, reminders: [], summary: null, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should dismiss a reminder', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });
    expect(result.current.reminders).toHaveLength(3);

    act(() => {
      result.current.dismissReminder('rem-1');
    });

    expect(result.current.reminders).toHaveLength(2);
    expect(result.current.reminders.find(r => r.id === 'rem-1')).toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lembrete dispensado' })
    );
  });

  it('should persist dismissed reminders to localStorage', async () => {
    const { result } = renderHook(() => useSmartReminders(false));

    act(() => {
      result.current.dismissReminder('rem-1');
    });

    const stored = JSON.parse(localStorage.getItem('dismissedReminders') || '{}');
    expect(stored['rem-1']).toBeTruthy();
  });

  it('should snooze a reminder', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: [fakeReminder], summary: { total: 1, byType: { follow_up: 1, birthday: 0, decay: 0, milestone: 0 }, byPriority: { high: 1, medium: 0, low: 0 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    act(() => {
      result.current.snoozeReminder('rem-1', 2);
    });

    expect(result.current.reminders).toHaveLength(0);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lembrete adiado' })
    );

    const snoozed = JSON.parse(localStorage.getItem('snoozedReminders') || '{}');
    expect(snoozed['rem-1']).toBeTruthy();
  });

  it('should complete a reminder', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: [fakeReminder], summary: { total: 1, byType: { follow_up: 1, birthday: 0, decay: 0, milestone: 0 }, byPriority: { high: 1, medium: 0, low: 0 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    let completed: any;
    act(() => {
      completed = result.current.completeReminder(fakeReminder);
    });

    expect(completed).toBeTruthy();
    expect(completed.id).toBe('rem-1');
    expect(result.current.reminders).toHaveLength(0);
  });

  it('should get high priority count', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    expect(result.current.getHighPriorityCount()).toBe(1);
  });

  it('should get reminders by type', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    expect(result.current.getRemindersByType('follow_up')).toHaveLength(1);
    expect(result.current.getRemindersByType('birthday')).toHaveLength(1);
    expect(result.current.getRemindersByType('milestone')).toHaveLength(0);
  });

  it('should filter out dismissed reminders on fetch', async () => {
    localStorage.setItem('dismissedReminders', JSON.stringify({ 'rem-1': Date.now() }));

    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: fakeReminders, summary: { total: 3, byType: { follow_up: 1, birthday: 1, decay: 1, milestone: 0 }, byPriority: { high: 1, medium: 1, low: 1 } }, aiInsights: null },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    expect(result.current.reminders.find(r => r.id === 'rem-1')).toBeUndefined();
  });

  it('should clean up old dismissed items from localStorage on mount', () => {
    // Set a very old entry
    localStorage.setItem('dismissedReminders', JSON.stringify({
      'old-rem': Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
      'birthday-rem': Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago (within 365)
    }));

    renderHook(() => useSmartReminders(false));

    const stored = JSON.parse(localStorage.getItem('dismissedReminders') || '{}');
    expect(stored['old-rem']).toBeUndefined(); // Cleaned up (>24h)
    expect(stored['birthday-rem']).toBeTruthy(); // Kept (within 365 days)
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('dismissedReminders', 'not valid json{');

    // Should not throw
    const { result } = renderHook(() => useSmartReminders(false));
    expect(result.current.reminders).toEqual([]);
  });

  it('should set aiInsights from response', async () => {
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true, reminders: [], summary: { total: 0, byType: { follow_up: 0, birthday: 0, decay: 0, milestone: 0 }, byPriority: { high: 0, medium: 0, low: 0 } }, aiInsights: 'Focus on follow-ups' },
      error: null,
    });

    const { result } = renderHook(() => useSmartReminders(false));
    await act(async () => { await result.current.fetchReminders(); });

    expect(result.current.aiInsights).toBe('Focus on follow-ups');
  });

  it('should fetch with analyze=true', async () => {
    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders(true);
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('smart-reminders', {
      body: { userId: 'test-user-123', action: 'analyze' },
    });
  });

  it('should fetch with analyze=false by default', async () => {
    const { result } = renderHook(() => useSmartReminders(false));

    await act(async () => {
      await result.current.fetchReminders();
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('smart-reminders', {
      body: { userId: 'test-user-123', action: 'fetch' },
    });
  });
});
