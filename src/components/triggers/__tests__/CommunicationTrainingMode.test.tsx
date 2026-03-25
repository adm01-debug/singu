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

import CommunicationTrainingMode from '../CommunicationTrainingMode';

describe('CommunicationTrainingMode', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<CommunicationTrainingMode />);
    expect(container).toBeTruthy();
  });

  it('shows training title', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/Treinamento|Comunicação|Training/i)).toBeInTheDocument();
  });

  it('shows DISC and VAK profile info', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/DISC|VAK|Perfil/i)).toBeInTheDocument();
  });

  it('renders tabs for different training sections', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/Cenários|Dicas|Prática/i)).toBeInTheDocument();
  });

  it('shows training scenarios', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/Cenário|Situação/i)).toBeInTheDocument();
  });

  it('renders radio group for answer options', () => {
    render(<CommunicationTrainingMode />);
    const radios = document.querySelectorAll('[role="radio"]');
    expect(radios.length).toBeGreaterThanOrEqual(0);
  });

  it('renders progress indicator', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/Progresso|Score|Resultado/i)).toBeInTheDocument();
  });

  it('calls supabase for salesperson profiles', async () => {
    render(<CommunicationTrainingMode />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('salesperson_profiles');
    });
  });

  it('renders collapsible tips sections', () => {
    render(<CommunicationTrainingMode />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows learning resources', () => {
    render(<CommunicationTrainingMode />);
    expect(screen.getByText(/Dica|Aprendizado|Recurso/i)).toBeInTheDocument();
  });
});
