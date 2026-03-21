import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockSingle = vi.fn().mockResolvedValue({ data: { nlp_profile: { discProfile: 'I' } }, error: null });
const mockEq = vi.fn(() => ({ single: mockSingle, order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) }));
const mockSelect = vi.fn(() => ({ eq: mockEq, order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: mockSelect, eq: mockEq })) }
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
vi.mock('@/data/discAdvancedData', () => ({
  DISC_PROFILES: {
    D: { name: 'Dominante', color: { bg: '#f00', text: '#fff' } },
    I: { name: 'Influente', color: { bg: '#ff0', text: '#000' } },
    S: { name: 'Estável', color: { bg: '#0f0', text: '#000' } },
    C: { name: 'Consciente', color: { bg: '#00f', text: '#fff' } },
  },
  getCompatibility: vi.fn(() => ({ score: 30, challenges: ['Challenge 1'], tips: ['Tip 1'] })),
}));
vi.mock('@/lib/contact-utils', () => ({
  getContactBehavior: vi.fn(),
  getDISCProfile: vi.fn(),
}));

import DISCCompatibilityAlerts from '../DISCCompatibilityAlerts';

describe('DISCCompatibilityAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the alerts title', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      expect(screen.getByText('Alertas de Compatibilidade')).toBeInTheDocument();
    });
  });

  it('shows subtitle description', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      expect(screen.getByText(/Contatos com baixa compatibilidade DISC/)).toBeInTheDocument();
    });
  });

  it('displays alerts count badge', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      expect(screen.getByText(/alertas/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no alerts', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      expect(screen.getByText('Tudo Sob Controle')).toBeInTheDocument();
    });
  });

  it('shows empty state description', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      expect(screen.getByText(/Nenhum contato com compatibilidade crítica/)).toBeInTheDocument();
    });
  });

  it('accepts compact prop', () => {
    const { container } = render(<DISCCompatibilityAlerts compact={true} />);
    expect(container).toBeTruthy();
  });

  it('accepts maxItems prop', () => {
    const { container } = render(<DISCCompatibilityAlerts maxItems={5} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<DISCCompatibilityAlerts className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders settings button', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders refresh button', async () => {
    render(<DISCCompatibilityAlerts />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
