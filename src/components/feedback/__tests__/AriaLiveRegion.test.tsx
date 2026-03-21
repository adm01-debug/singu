import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AriaLiveProvider, useAriaLiveRegion, liveAnnouncements } from '../AriaLiveRegion';

// Test component that uses the hook
function TestConsumer() {
  const { announce, announcePolite, announceAssertive } = useAriaLiveRegion();
  return (
    <div>
      <button onClick={() => announce('Test message')}>Announce</button>
      <button onClick={() => announcePolite('Polite message')}>Polite</button>
      <button onClick={() => announceAssertive('Assertive message')}>Assertive</button>
      <button onClick={() => announce('Off message', 'off')}>Off</button>
    </div>
  );
}

describe('AriaLiveProvider', () => {
  it('renders children', () => {
    render(
      <AriaLiveProvider>
        <div>Child Content</div>
      </AriaLiveProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders polite live region', () => {
    render(
      <AriaLiveProvider>
        <div>Content</div>
      </AriaLiveProvider>
    );
    const polite = screen.getByRole('status');
    expect(polite).toHaveAttribute('aria-live', 'polite');
    expect(polite).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders assertive live region', () => {
    render(
      <AriaLiveProvider>
        <div>Content</div>
      </AriaLiveProvider>
    );
    const assertive = screen.getByRole('alert');
    expect(assertive).toHaveAttribute('aria-live', 'assertive');
    expect(assertive).toHaveAttribute('aria-atomic', 'true');
  });

  it('has sr-only class on live regions', () => {
    const { container } = render(
      <AriaLiveProvider>
        <div>Content</div>
      </AriaLiveProvider>
    );
    const srOnlyElements = container.querySelectorAll('.sr-only');
    expect(srOnlyElements.length).toBe(2);
  });

  it('provides announce function through context', () => {
    render(
      <AriaLiveProvider>
        <TestConsumer />
      </AriaLiveProvider>
    );
    expect(screen.getByText('Announce')).toBeInTheDocument();
    expect(screen.getByText('Polite')).toBeInTheDocument();
    expect(screen.getByText('Assertive')).toBeInTheDocument();
  });
});

describe('useAriaLiveRegion', () => {
  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAriaLiveRegion must be used within an AriaLiveProvider');
    consoleSpy.mockRestore();
  });
});

describe('liveAnnouncements', () => {
  it('returns saving message', () => {
    expect(liveAnnouncements.saving).toBe('Salvando...');
  });

  it('returns saved message with name', () => {
    expect(liveAnnouncements.saved('Contato')).toBe('Contato salvo com sucesso');
  });

  it('returns saved message without name', () => {
    expect(liveAnnouncements.saved()).toBe('Item salvo com sucesso');
  });

  it('returns search results message for zero results', () => {
    expect(liveAnnouncements.searchResults(0, 'test')).toBe('Nenhum resultado encontrado para "test"');
  });

  it('returns search results message for one result', () => {
    expect(liveAnnouncements.searchResults(1)).toBe('1 resultado encontrado');
  });

  it('returns search results message for multiple results', () => {
    expect(liveAnnouncements.searchResults(5, 'João')).toBe('5 resultados encontrados para "João"');
  });

  it('returns loading message with context', () => {
    expect(liveAnnouncements.loading('contatos')).toBe('Carregando contatos...');
  });

  it('returns navigatedTo message', () => {
    expect(liveAnnouncements.navigatedTo('Dashboard')).toBe('Navegou para Dashboard');
  });

  it('returns error message', () => {
    expect(liveAnnouncements.error('Connection failed')).toBe('Erro: Connection failed');
  });

  it('returns offline message', () => {
    expect(liveAnnouncements.offline).toBe('Você está offline');
  });

  it('returns new notification message', () => {
    expect(liveAnnouncements.newNotification(1)).toBe('1 nova notificação');
    expect(liveAnnouncements.newNotification(3)).toBe('3 novas notificações');
  });
});
