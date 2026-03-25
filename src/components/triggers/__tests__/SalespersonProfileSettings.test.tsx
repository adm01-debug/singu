import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle, eq: mockEq }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: vi.fn().mockResolvedValue({ error: null }) }));
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
vi.mock('@/types/vak', () => ({
  VAKType: {}, VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
}));
vi.mock('@/types/metaprograms', () => ({
  METAPROGRAM_LABELS: {},
}));

import { SalespersonProfileSettings } from '../SalespersonProfileSettings';

describe('SalespersonProfileSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<SalespersonProfileSettings />);
    expect(container).toBeTruthy();
  });

  it('shows profile settings title', () => {
    render(<SalespersonProfileSettings />);
    expect(screen.getByText(/Perfil|Vendedor|Configurações/i)).toBeInTheDocument();
  });

  it('shows VAK profile section', () => {
    render(<SalespersonProfileSettings />);
    expect(screen.getByText(/VAK|Visual|Auditivo/i)).toBeInTheDocument();
  });

  it('shows DISC profile section', () => {
    render(<SalespersonProfileSettings />);
    expect(screen.getByText(/DISC|Dominante|Influente/i)).toBeInTheDocument();
  });

  it('renders radio group for selections', () => {
    render(<SalespersonProfileSettings />);
    const radios = document.querySelectorAll('[role="radio"]');
    expect(radios.length).toBeGreaterThanOrEqual(1);
  });

  it('shows save button', () => {
    render(<SalespersonProfileSettings />);
    expect(screen.getByText(/Salvar|Save/i)).toBeInTheDocument();
  });

  it('calls supabase for salesperson_profiles', async () => {
    render(<SalespersonProfileSettings />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('salesperson_profiles');
    });
  });

  it('shows metaprogram section', () => {
    render(<SalespersonProfileSettings />);
    expect(screen.getByText(/Metaprograma|Motivação|Referência/i)).toBeInTheDocument();
  });
});
