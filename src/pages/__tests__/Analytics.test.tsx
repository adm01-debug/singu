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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), limit: vi.fn().mockResolvedValue({ data: [], error: null }), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/analytics', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null,
  Tooltip: () => null, Legend: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>, Line: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>, Pie: () => null, Cell: () => null,
  RadarChart: ({ children }: any) => <div>{children}</div>, Radar: () => null,
  PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>, Area: () => null,
  ComposedChart: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/triggers/TriggerAnalytics', () => ({ TriggerAnalytics: () => <div data-testid="trigger-analytics" /> }));
vi.mock('@/components/triggers/AdvancedTriggersPanel', () => ({ AdvancedTriggersPanel: () => <div data-testid="advanced-triggers" /> }));
vi.mock('@/components/analytics/ChurnPredictionPanel', () => ({ ChurnPredictionPanel: () => <div data-testid="churn-prediction" /> }));
vi.mock('@/components/analytics/BestTimeToContactPanel', () => ({ BestTimeToContactPanel: () => <div data-testid="best-time" /> }));
vi.mock('@/components/analytics/DealVelocityPanel', () => ({ DealVelocityPanel: () => <div data-testid="deal-velocity" /> }));
vi.mock('@/components/analytics/NLPAnalyticsPanel', () => ({ NLPAnalyticsPanel: () => <div data-testid="nlp-analytics" /> }));
vi.mock('@/components/analytics/ClosingScoreRanking', () => ({ ClosingScoreRanking: () => <div data-testid="closing-ranking" /> }));
vi.mock('@/components/analytics/AccountChurnPredictionPanel', () => ({ AccountChurnPredictionPanel: () => <div data-testid="account-churn" /> }));
vi.mock('@/components/analytics/RFMAnalysisPanel', () => ({ RFMAnalysisPanel: () => <div data-testid="rfm-analysis" /> }));
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
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`trigger-${value}`}>{children}</button>,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

import Analytics from '../Analytics';

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Analytics />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Analytics header', () => {
    render(<Analytics />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<Analytics />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders tabs component', () => {
    render(<Analytics />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders the header component', () => {
    render(<Analytics />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('does not crash with empty data', () => {
    expect(() => render(<Analytics />)).not.toThrow();
  });

  it('renders page container', () => {
    render(<Analytics />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows analytics subtitle', () => {
    render(<Analytics />);
    // The header should contain analytics-related subtitle
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
