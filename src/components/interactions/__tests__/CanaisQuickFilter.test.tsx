import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanaisQuickFilter } from '@/components/interactions/CanaisQuickFilter';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
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

  it('manual mode: Revert opens confirmation and restores pending to applied value when confirmed', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByTitle('WhatsApp'));
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reverter/i }));
    // Confirma no dialog
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
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

  it('auto mode: Limpar canais calls onChange with empty array', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email', 'whatsapp']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Limpar seleção de canais/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('manual mode: Limpar canais clears pending without calling onChange', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Limpar seleção de canais/i }));
    expect(onChange).not.toHaveBeenCalled();
    // Aplicar continua visível pra confirmar a divergência
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  it('Limpar canais button is hidden when no channels are selected', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: /Limpar seleção de canais/i })).not.toBeInTheDocument();
  });

  it('counts: without counts prop, chips render only icon + label (no number)', () => {
    const onChange = vi.fn();
    const { container } = render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    // Nenhum span com o estilo de contador deve existir
    const counters = container.querySelectorAll('span.tabular-nums');
    expect(counters.length).toBe(0);
  });

  it('counts: shows number next to chip and applies opacity-50 to zero-count chips', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CanaisQuickFilter canais={[]} onChange={onChange} counts={{ email: 12, whatsapp: 0 }} />
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    const whatsappChip = screen.getByTitle('WhatsApp');
    expect(whatsappChip.className).toContain('opacity-50');
    const emailChip = screen.getByTitle('Email');
    expect(emailChip.className).not.toContain('opacity-50');
  });

  it('counts: caps display at 999+ for counts greater than 999', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} counts={{ email: 1500 }} />);
    expect(screen.getByText('999+')).toBeInTheDocument();
  });

  it('keyboard: Alt+1 toggles WhatsApp in auto mode', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(onChange).toHaveBeenCalledWith(['whatsapp']);
  });

  it('keyboard: Alt+0 clears channels in auto mode', () => {
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={['email']} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '0', altKey: true });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('keyboard: Alt+N works even when focus is inside an input', () => {
    const onChange = vi.fn();
    render(
      <div>
        <input data-testid="search-input" />
        <CanaisQuickFilter canais={[]} onChange={onChange} />
      </div>
    );
    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: '3', altKey: true, bubbles: true });
    expect(onChange).toHaveBeenCalledWith(['email']);
  });

  it('keyboard: in manual mode, Alt+N updates pending without calling onChange', () => {
    localStorage.setItem('channel-sync-mode', 'manual');
    const onChange = vi.fn();
    render(<CanaisQuickFilter canais={[]} onChange={onChange} />);
    fireEvent.keyDown(window, { key: '1', altKey: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });
});
