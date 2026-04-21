import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChannelSyncMode } from '@/hooks/useChannelSyncMode';

describe('useChannelSyncMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default mode is auto when localStorage empty', () => {
    const { result } = renderHook(() => useChannelSyncMode());
    expect(result.current.mode).toBe('auto');
  });

  it('setMode persists to localStorage', () => {
    const { result } = renderHook(() => useChannelSyncMode());
    act(() => {
      result.current.setMode('manual');
    });
    expect(result.current.mode).toBe('manual');
    expect(localStorage.getItem('channel-sync-mode')).toBe('manual');
  });

  it('toggle alternates between auto and manual', () => {
    const { result } = renderHook(() => useChannelSyncMode());
    expect(result.current.mode).toBe('auto');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('manual');
    act(() => result.current.toggle());
    expect(result.current.mode).toBe('auto');
  });

  it('reads persisted value on remount', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const { result } = renderHook(() => useChannelSyncMode());
    expect(result.current.mode).toBe('manual');
  });

  it('ignores invalid persisted values', () => {
    localStorage.setItem('channel-sync-mode', 'garbage');
    const { result } = renderHook(() => useChannelSyncMode());
    expect(result.current.mode).toBe('auto');
  });
});
