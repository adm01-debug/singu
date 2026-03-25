import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));

const mockUsePurchasePatterns = vi.fn();
vi.mock('@/hooks/usePurchasePatterns', () => ({
  usePurchasePatterns: () => mockUsePurchasePatterns(),
}));

import { PurchasePatternsPanel } from '../PurchasePatternsPanel';

describe('PurchasePatternsPanel', () => {
  const defaultMock = {
    patterns: [],
    categoryPatterns: [],
    predictions: [],
    stats: { overdue: 0, upcomingWeek: 0, highFrequency: 0, totalRevenue: 0 },
    loading: false,
    refresh: vi.fn(),
  };

  beforeEach(() => {
    mockUsePurchasePatterns.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('Padrões de Compra')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUsePurchasePatterns.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<PurchasePatternsPanel />);
    const skeletons = container.querySelectorAll('[class*="bg-muted"], [class*="shimmer"], .animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state for predictions tab', () => {
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('Nenhuma previsão para os próximos dias')).toBeInTheDocument();
  });

  it('displays stats summary', () => {
    mockUsePurchasePatterns.mockReturnValue({
      ...defaultMock,
      stats: { overdue: 3, upcomingWeek: 5, highFrequency: 10, totalRevenue: 50000 },
    });
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Atrasados')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Próx. 7 dias')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('Previsões')).toBeInTheDocument();
    expect(screen.getByText('Padrões')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('shows predictions when data present', () => {
    mockUsePurchasePatterns.mockReturnValue({
      ...defaultMock,
      predictions: [
        {
          contactId: '1',
          contactName: 'Alice Test',
          predictedDate: '2026-04-01',
          reason: 'Ciclo de 30 dias',
          confidence: 85,
          suggestedProducts: ['Product A'],
        },
      ],
    });
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('Alice Test')).toBeInTheDocument();
    expect(screen.getByText('85% conf.')).toBeInTheDocument();
  });

  it('renders description subtitle', () => {
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('Detecção automática de ciclos e oportunidades')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    const { container } = render(<PurchasePatternsPanel />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders high frequency count in stats', () => {
    mockUsePurchasePatterns.mockReturnValue({
      ...defaultMock,
      stats: { overdue: 0, upcomingWeek: 0, highFrequency: 7, totalRevenue: 0 },
    });
    render(<PurchasePatternsPanel />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Alta Freq.')).toBeInTheDocument();
  });

  it('handles compact mode', () => {
    mockUsePurchasePatterns.mockReturnValue({
      ...defaultMock,
      predictions: Array.from({ length: 5 }, (_, i) => ({
        contactId: `${i}`,
        contactName: `User ${i}`,
        predictedDate: '2026-04-01',
        reason: 'Test',
        confidence: 70,
        suggestedProducts: [],
      })),
    });
    render(<PurchasePatternsPanel compact={true} />);
    // In compact mode, only 3 predictions shown
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.queryByText('User 3')).not.toBeInTheDocument();
  });
});
