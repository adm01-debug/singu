import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useActionToast } from '@/hooks/useActionToast';

// Mock Sonner
const toastMock = vi.fn();
const successMock = vi.fn();
const errorMock = vi.fn();
const infoMock = vi.fn();
const warningMock = vi.fn();

vi.mock('sonner', () => ({
  toast: Object.assign((...args: unknown[]) => toastMock(...args), {
    success: (...args: unknown[]) => successMock(...args),
    error: (...args: unknown[]) => errorMock(...args),
    info: (...args: unknown[]) => infoMock(...args),
    warning: (...args: unknown[]) => warningMock(...args),
  }),
}));

const announceMock = vi.fn();
vi.mock('@/components/feedback/AriaLiveRegion', () => ({
  useAriaLiveRegion: () => ({ announce: announceMock }),
  AriaLiveProvider: ({ children }: { children: ReactNode }) => children,
}));

beforeEach(() => {
  toastMock.mockClear();
  successMock.mockClear();
  errorMock.mockClear();
  infoMock.mockClear();
  warningMock.mockClear();
  announceMock.mockClear();
});

describe('useActionToast', () => {
  it('success() chama toast.success e announce polite', () => {
    const { result } = renderHook(() => useActionToast());
    act(() => result.current.success('OK', 'detalhe'));
    expect(successMock).toHaveBeenCalledWith('OK', { description: 'detalhe' });
    expect(announceMock).toHaveBeenCalledWith('OK', 'polite');
  });

  it('error() chama toast.error e announce assertive', () => {
    const { result } = renderHook(() => useActionToast());
    act(() => result.current.error('Falhou'));
    expect(errorMock).toHaveBeenCalled();
    expect(announceMock).toHaveBeenCalledWith('Falhou', 'assertive');
  });

  it('destructive() registra ação Undo que dispara onUndo', () => {
    const onUndo = vi.fn();
    const { result } = renderHook(() => useActionToast());
    act(() =>
      result.current.destructive({ message: 'Excluído', onUndo, timeoutMs: 1000 }),
    );
    expect(toastMock).toHaveBeenCalledTimes(1);
    const [msg, opts] = toastMock.mock.calls[0] as [string, { action: { label: string; onClick: () => void } }];
    expect(msg).toBe('Excluído');
    expect(opts.action.label).toBe('Desfazer');
    // Simula clique no Undo
    act(() => opts.action.onClick());
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('destructive() não quebra se onUndo lança Promise rejeitada', async () => {
    const onUndo = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useActionToast());
    act(() => result.current.destructive({ message: 'X', onUndo }));
    const [, opts] = toastMock.mock.calls[0] as [string, { action: { onClick: () => void } }];
    expect(() => opts.action.onClick()).not.toThrow();
    expect(onUndo).toHaveBeenCalled();
  });
});
