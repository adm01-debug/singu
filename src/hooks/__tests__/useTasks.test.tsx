import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';
import { useCompleteTask, useReopenTask, type Task } from '@/hooks/useTasks';

const callExternalRpcMock = vi.fn();
const updateExternalDataMock = vi.fn();

vi.mock('@/lib/externalData', () => ({
  callExternalRpc: (...args: unknown[]) => callExternalRpcMock(...args),
  queryExternalData: vi.fn(),
  updateExternalData: (...args: unknown[]) => updateExternalDataMock(...args),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), group: vi.fn(), groupEnd: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

const seedTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Ligar para João',
  status: 'pending',
  created_at: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  callExternalRpcMock.mockReset();
  updateExternalDataMock.mockReset();
});

describe('useCompleteTask (optimistic update + rollback)', () => {
  it('aplica optimistic update e marca status=completed instantaneamente', async () => {
    const { qc, wrapper } = makeWrapper();
    qc.setQueryData<Task[]>(['tasks', 'pending'], [seedTask()]);
    callExternalRpcMock.mockResolvedValue({ data: { ok: true }, error: null });

    const { result } = renderHook(() => useCompleteTask(), { wrapper });

    result.current.mutate('t1');
    // Optimistic — verificado no próximo tick
    await waitFor(() => {
      const cached = qc.getQueryData<Task[]>(['tasks', 'pending']);
      expect(cached?.[0].status).toBe('completed');
      expect(cached?.[0].completed_at).toBeTruthy();
    });
  });

  it('faz rollback completo em caso de erro do servidor', async () => {
    const { qc, wrapper } = makeWrapper();
    const original = [seedTask()];
    qc.setQueryData<Task[]>(['tasks', 'pending'], original);
    callExternalRpcMock.mockResolvedValue({ data: null, error: new Error('rpc failed') });

    const { result } = renderHook(() => useCompleteTask(), { wrapper });
    result.current.mutate('t1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = qc.getQueryData<Task[]>(['tasks', 'pending']);
    expect(cached?.[0].status).toBe('pending');
    expect(cached?.[0].completed_at).toBeUndefined();
  });
});

describe('useReopenTask', () => {
  it('chama RPC reopen_task com p_task_id', async () => {
    const { wrapper } = makeWrapper();
    callExternalRpcMock.mockResolvedValue({ data: { ok: true }, error: null });
    const { result } = renderHook(() => useReopenTask(), { wrapper });

    result.current.mutate('t-42');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callExternalRpcMock).toHaveBeenCalledWith('reopen_task', { p_task_id: 't-42' });
  });

  it('faz fallback para updateExternalData quando RPC falha', async () => {
    const { wrapper } = makeWrapper();
    callExternalRpcMock.mockResolvedValue({ data: null, error: new Error('no rpc') });
    updateExternalDataMock.mockResolvedValue({ data: { id: 't-42' }, error: null });

    const { result } = renderHook(() => useReopenTask(), { wrapper });
    result.current.mutate('t-42');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateExternalDataMock).toHaveBeenCalledWith('tasks', 't-42', {
      status: 'pending',
      completed_at: null,
    });
  });
});
