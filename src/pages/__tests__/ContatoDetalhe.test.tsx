import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', last_name: 'User' } }, session: { access_token: 'token' }, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }), Toaster: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), limit: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/contatos/test-id-123', search: '', hash: '' }),
  useParams: () => ({ id: 'test-id-123' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockContact = {
  id: 'test-id-123',
  first_name: 'Maria',
  last_name: 'Oliveira',
  email: 'maria@test.com',
  phone: '11999998888',
  whatsapp: '11999998888',
  role_title: 'Diretora',
  avatar_url: null,
  company_id: 'comp-1',
  relationship_score: 85,
};

const mockCompany = { id: 'comp-1', name: 'Acme Corp' };

vi.mock('@/hooks/useContactDetail', () => ({
  useContactDetail: () => ({
    contact: mockContact,
    company: mockCompany,
    loading: false,
    error: null,
  }),
}));
vi.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({ trackView: vi.fn(), recentlyViewed: [] }),
}));
vi.mock('@/hooks/useLuxIntelligence', () => ({
  useLuxIntelligence: () => ({
    records: [],
    latestRecord: null,
    loading: false,
    triggering: false,
    triggerLux: vi.fn(),
  }),
}));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/lux/LuxButton', () => ({ LuxButton: () => <button data-testid="lux-button">Lux</button> }));
vi.mock('@/components/lux/LuxIntelligencePanel', () => ({ LuxIntelligencePanel: () => <div data-testid="lux-panel" /> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button>{children}</button>,
}));

import ContatoDetalhe from '../ContatoDetalhe';

describe('ContatoDetalhe Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows contact full name', () => {
    render(<ContatoDetalhe />);
    const elements = screen.getAllByText('Maria Oliveira');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows contact role title', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByText('Diretora')).toBeInTheDocument();
  });

  it('shows contact email', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByText('maria@test.com')).toBeInTheDocument();
  });

  it('shows contact phone', () => {
    render(<ContatoDetalhe />);
    const elements = screen.getAllByText('11999998888');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows company name', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows breadcrumb navigation', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('has tabs for info and lux', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByText('Informações')).toBeInTheDocument();
    expect(screen.getByText('Lux Intelligence')).toBeInTheDocument();
  });

  it('renders Lux button', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByTestId('lux-button')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<ContatoDetalhe />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('displays WhatsApp info', () => {
    render(<ContatoDetalhe />);
    const elements = screen.getAllByText('11999998888');
    expect(elements.length).toBeGreaterThanOrEqual(2); // Phone + WhatsApp
  });
});
