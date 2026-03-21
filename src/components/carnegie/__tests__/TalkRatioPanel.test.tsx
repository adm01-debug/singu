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
    analyzeTalkRatio: (text: string, isSalesRep: boolean) => ({
      talkPercentage: 35,
      listenPercentage: 65,
      questionCount: 5,
      quality: 'good',
      tips: ['Great balance', 'Keep asking questions'],
      questionTypes: { open: 3, closed: 2 },
    }),
  }),
}));

import { TalkRatioPanel } from '../TalkRatioPanel';

describe('TalkRatioPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<TalkRatioPanel />);
    expect(container).toBeTruthy();
  });

  it('renders textarea for input', () => {
    const { container } = render(<TalkRatioPanel />);
    const textareas = container.querySelectorAll('textarea');
    expect(textareas.length).toBeGreaterThan(0);
  });

  it('renders card container', () => {
    const { container } = render(<TalkRatioPanel />);
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders with a contact', () => {
    const contact = { id: '1', first_name: 'Test', last_name: 'User' } as any;
    const { container } = render(<TalkRatioPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<TalkRatioPanel className="custom" />);
    expect(container).toBeTruthy();
  });

  it('handles text input change', () => {
    render(<TalkRatioPanel />);
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test conversation text' } });
    expect(textarea.value).toBe('Test conversation text');
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(<TalkRatioPanel />);
    expect(() => rerender(<TalkRatioPanel />)).not.toThrow();
  });

  it('renders analyze button', () => {
    const { container } = render(<TalkRatioPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows no analysis result initially', () => {
    render(<TalkRatioPanel />);
    // No analysis result before clicking analyze
    expect(screen.queryByText('Excelente')).not.toBeInTheDocument();
    expect(screen.queryByText('Bom')).not.toBeInTheDocument();
  });

  it('renders with null contact', () => {
    const { container } = render(<TalkRatioPanel contact={null} />);
    expect(container).toBeTruthy();
  });
});
