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

import { CompatibilityAlertSettings } from '../CompatibilityAlertSettings';

describe('CompatibilityAlertSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<CompatibilityAlertSettings />);
    expect(container).toBeTruthy();
  });

  it('shows settings title', () => {
    render(<CompatibilityAlertSettings />);
    expect(screen.getByText(/Configurações|Settings/i)).toBeInTheDocument();
  });

  it('renders threshold slider area', async () => {
    render(<CompatibilityAlertSettings />);
    await waitFor(() => {
      expect(screen.getByText(/Limite|Threshold|50/i)).toBeInTheDocument();
    });
  });

  it('renders switches for settings', () => {
    render(<CompatibilityAlertSettings />);
    const switches = document.querySelectorAll('[role="switch"]');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows save button', () => {
    render(<CompatibilityAlertSettings />);
    expect(screen.getByText(/Salvar|Save/i)).toBeInTheDocument();
  });

  it('calls supabase for compatibility_settings', async () => {
    render(<CompatibilityAlertSettings />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('compatibility_settings');
    });
  });

  it('shows email notification toggle', () => {
    render(<CompatibilityAlertSettings />);
    expect(screen.getByText(/Email|Notificações/i)).toBeInTheDocument();
  });

  it('shows importance filter option', () => {
    render(<CompatibilityAlertSettings />);
    expect(screen.getByText(/Importante|Relacionamento/i)).toBeInTheDocument();
  });
});
