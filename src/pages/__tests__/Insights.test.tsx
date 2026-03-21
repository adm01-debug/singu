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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), limit: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/insights', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: () => ({ results: [], setQuery: vi.fn(), query: '', isSearching: false, clearSearch: vi.fn() }),
}));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/feedback/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/navigation/SmartBreadcrumbs', () => ({ SmartBreadcrumbs: () => <div data-testid="breadcrumbs" /> }));
vi.mock('@/components/micro-interactions/MorphingNumber', () => ({ MorphingNumber: ({ value }: any) => <span>{value}</span> }));
vi.mock('@/components/triggers/PortfolioCompatibilityReport', () => ({ PortfolioCompatibilityReport: () => <div data-testid="portfolio-report" /> }));
vi.mock('@/components/triggers/CompatibilityAlertsList', () => ({ CompatibilityAlertsList: () => <div data-testid="compatibility-alerts" /> }));
vi.mock('@/components/carnegie', () => ({ CarnegieDashboard: () => <div data-testid="carnegie-dashboard" /> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`trigger-${value}`}>{children}</button>,
}));

import Insights from '../Insights';

describe('Insights Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Insights />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Insights header', () => {
    render(<Insights />);
    expect(screen.getByText('Insights com IA')).toBeInTheDocument();
  });

  it('shows subtitle', () => {
    render(<Insights />);
    expect(screen.getByText('Análise inteligente dos seus relacionamentos e interações')).toBeInTheDocument();
  });

  it('renders tabs for insights, compatibility, and carnegie', () => {
    render(<Insights />);
    expect(screen.getByTestId('trigger-insights')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-compatibility')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-carnegie')).toBeInTheDocument();
  });

  it('shows generate insights button', () => {
    render(<Insights />);
    expect(screen.getByText('Gerar Novos Insights')).toBeInTheDocument();
  });

  it('shows stat cards', () => {
    render(<Insights />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Riscos')).toBeInTheDocument();
    expect(screen.getByText('Acionáveis')).toBeInTheDocument();
  });

  it('shows category filter buttons', () => {
    render(<Insights />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Personalidade')).toBeInTheDocument();
    expect(screen.getByText('Oportunidade')).toBeInTheDocument();
    expect(screen.getByText('Risco')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Insights />);
    expect(screen.getByPlaceholderText(/Buscar insights/)).toBeInTheDocument();
  });

  it('shows empty state when no insights', () => {
    render(<Insights />);
    expect(screen.getByText('Nenhum insight gerado')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Insights />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });
});
