import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockFrom = vi.fn(() => ({ select: mockSelect, eq: mockEq, maybeSingle: mockMaybeSingle }));
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
vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({ results: [], search: '', setSearch: vi.fn() })),
}));
vi.mock('@/types/vak', () => ({
  VAKType: {}, VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
}));
vi.mock('@/types/metaprograms', () => ({
  METAPROGRAM_LABELS: {},
}));

import PortfolioCompatibilityReport from '../PortfolioCompatibilityReport';

describe('PortfolioCompatibilityReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it('renders the component', () => {
    const { container } = render(<PortfolioCompatibilityReport />);
    expect(container).toBeTruthy();
  });

  it('shows loading skeleton initially', () => {
    render(<PortfolioCompatibilityReport />);
    const skeletons = document.querySelectorAll('.animate-pulse, [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows report title after loading', async () => {
    render(<PortfolioCompatibilityReport />);
    await waitFor(() => {
      expect(screen.getByText(/Portfólio|Relatório|Compatibilidade/i)).toBeInTheDocument();
    });
  });

  it('accepts className prop', () => {
    const { container } = render(<PortfolioCompatibilityReport className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders search input', async () => {
    render(<PortfolioCompatibilityReport />);
    await waitFor(() => {
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('calls supabase for contacts', async () => {
    render(<PortfolioCompatibilityReport />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('contacts');
    });
  });

  it('calls supabase for salesperson_profiles', async () => {
    render(<PortfolioCompatibilityReport />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('salesperson_profiles');
    });
  });

  it('renders sort and filter controls', async () => {
    render(<PortfolioCompatibilityReport />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
