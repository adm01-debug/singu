import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanaisQuickFilter } from '@/components/interactions/CanaisQuickFilter';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('CanaisQuickFilter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('auto mode: clicking a chip calls onChange immediately', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(onChange).toHaveBeenCalledWith(['email']);
  });

  it('manual mode: clicking a chip does NOT call onChange and shows Apply button', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  it('manual mode: Apply button calls onChange with pending selection', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByTitle('WhatsApp'));
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'whatsapp']);
  });

  it('manual mode: Revert restores pending to applied value', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('WhatsApp'));
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Reverter alterações pendentes'));
    expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('manual mode: persists pending to localStorage', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByTitle('WhatsApp'));
    const stored = JSON.parse(localStorage.getItem('channel-pending-canais') || '[]');
    expect(stored).toEqual(expect.arrayContaining(['email', 'whatsapp']));
  });

  it('manual mode: restores pending from localStorage on remount', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    localStorage.setItem('channel-pending-canais', JSON.stringify(['email', 'call']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'call']);
  });

  it('manual mode: clears persisted pending after apply (no divergence)', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    const { rerender } = render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(localStorage.getItem('channel-pending-canais')).not.toBeNull();
    fireEvent.click(screen.getByText('Aplicar'));
    rerender(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    expect(localStorage.getItem('channel-pending-canais')).toBeNull();
  });

  it('manual mode: ignores invalid persisted values', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    localStorage.setItem('channel-pending-canais', JSON.stringify(['email', 'invalid_channel', 'call']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onChange).toHaveBeenCalledWith(['email', 'call']);
  });

  it('auto mode: does not restore pending from localStorage', () => {
    localStorage.setItem('channel-sync-mode', 'auto');
    localStorage.setItem('channel-pending-canais', JSON.stringify(['email']));
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.queryByText('Aplicar')).not.toBeInTheDocument();
  });
});
