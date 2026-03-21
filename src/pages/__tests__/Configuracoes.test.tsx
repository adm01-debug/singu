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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { first_name: 'Test', last_name: 'User', avatar_url: null }, error: null }), update: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })), updateUser: vi.fn().mockResolvedValue({ error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/configuracoes', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/theme/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/feedback/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/navigation/SmartBreadcrumbs', () => ({ SmartBreadcrumbs: () => <div data-testid="breadcrumbs" /> }));
vi.mock('@/components/triggers/TemplateNotificationSettings', () => ({ TemplateNotificationSettings: () => <div data-testid="template-settings" /> }));
vi.mock('@/components/triggers/SalespersonProfileSettings', () => ({ SalespersonProfileSettings: () => <div data-testid="salesperson-settings" /> }));
vi.mock('@/components/triggers/CommunicationTrainingMode', () => ({ CommunicationTrainingMode: () => <div data-testid="communication-training" /> }));
vi.mock('@/components/triggers/CompatibilityAlertSettings', () => ({ CompatibilityAlertSettings: () => <div data-testid="compatibility-settings" /> }));
vi.mock('@/components/dashboard/WeeklyReportPanel', () => ({ WeeklyReportPanel: () => <div data-testid="weekly-report" /> }));
vi.mock('@/components/settings/TourPreferencesPanel', () => ({ TourPreferencesPanel: () => <div data-testid="tour-prefs" /> }));
vi.mock('@/components/settings/ThemeCustomizer', () => ({ ThemeCustomizer: () => <div data-testid="theme-customizer" /> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));
vi.mock('@/components/ui/switch', () => ({
  Switch: (props: any) => <input type="checkbox" role="switch" {...props} />,
}));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`trigger-${value}`}>{children}</button>,
}));
vi.mock('@/components/ui/optimized-avatar', () => ({ OptimizedAvatar: () => <div data-testid="avatar" /> }));
vi.mock('@/components/ui/separator', () => ({ Separator: () => <hr /> }));

import Configuracoes from '../Configuracoes';

describe('Configuracoes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Configurações header', () => {
    render(<Configuracoes />);
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders tabs', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders profile tab trigger', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('trigger-profile')).toBeInTheDocument();
  });

  it('renders appearance tab trigger', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('trigger-appearance')).toBeInTheDocument();
  });

  it('renders notifications tab trigger', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('trigger-notifications')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('does not crash with user data', () => {
    expect(() => render(<Configuracoes />)).not.toThrow();
  });

  it('renders breadcrumbs', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('renders the header', () => {
    render(<Configuracoes />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
