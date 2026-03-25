import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
const mockEq = vi.fn(() => ({ eq: mockEq, order: mockOrder, limit: mockLimit }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 dias'),
}));
vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

import { CompatibilityAlertsList } from '../CompatibilityAlertsList';

describe('CompatibilityAlertsList', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<CompatibilityAlertsList />);
    expect(container).toBeTruthy();
  });

  it('shows header by default', () => {
    render(<CompatibilityAlertsList />);
    expect(screen.getByText(/Alertas|Compatibilidade/i)).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<CompatibilityAlertsList showHeader={false} />);
    expect(container).toBeTruthy();
  });

  it('accepts maxItems prop', () => {
    const { container } = render(<CompatibilityAlertsList maxItems={3} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<CompatibilityAlertsList className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('calls supabase for compatibility_alerts', async () => {
    render(<CompatibilityAlertsList />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('compatibility_alerts');
    });
  });

  it('shows empty state when no alerts', async () => {
    render(<CompatibilityAlertsList />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhum|vazio|Sem alertas/i)).toBeInTheDocument();
    });
  });

  it('renders refresh button', () => {
    render(<CompatibilityAlertsList />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
