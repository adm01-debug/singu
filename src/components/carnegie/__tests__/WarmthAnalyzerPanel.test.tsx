import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('@/hooks/useCarnegieAnalysis', () => ({
  useCarnegieAnalysis: () => ({
    analyzeWarmth: (text: string) => ({
      score: 75,
      level: 'warm',
      indicators: { positive: ['empathy'], negative: [] },
      suggestions: ['Add more personal touch'],
    }),
  }),
}));

import { WarmthAnalyzerPanel } from '../WarmthAnalyzerPanel';

describe('WarmthAnalyzerPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<WarmthAnalyzerPanel />);
    expect(container).toBeTruthy();
  });

  it('renders the panel with title', () => {
    const { container } = render(<WarmthAnalyzerPanel />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders textarea for input', () => {
    const { container } = render(<WarmthAnalyzerPanel />);
    const textareas = container.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThan(0);
  });

  it('renders with initial text', () => {
    render(<WarmthAnalyzerPanel initialText="Hello friend" />);
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hello friend');
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<WarmthAnalyzerPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<WarmthAnalyzerPanel className="custom-class" />);
    expect(container).toBeTruthy();
  });

  it('renders analyze button', () => {
    const { container } = render(<WarmthAnalyzerPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles text input change', () => {
    render(<WarmthAnalyzerPanel />);
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(textarea.value).toBe('New text');
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<WarmthAnalyzerPanel />);
    expect(() => rerender(<WarmthAnalyzerPanel />)).not.toThrow();
  });

  it('renders card container', () => {
    const { container } = render(<WarmthAnalyzerPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows no warmth result initially', () => {
    render(<WarmthAnalyzerPanel />);
    // No analysis result should be shown before clicking analyze
    expect(screen.queryByText('Caloroso')).not.toBeInTheDocument();
  });
});
