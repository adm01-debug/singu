import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock ALL external dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', last_name: 'User' } }, session: { access_token: 'token' }, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }), Toaster: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), contains: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
  mutateExternalData: vi.fn().mockResolvedValue({ data: null, error: null }),
  callExternalFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
  useParams: () => ({ id: 'test-id-123' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  Navigate: () => null,
  Outlet: () => null,
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
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));
vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'shape') }) }));
vi.mock('react-force-graph-2d', () => ({ default: (props: any) => <div data-testid="force-graph" /> }));

// Page-specific mocks
vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({ contacts: [], loading: false, createContact: vi.fn(), updateContact: vi.fn(), deleteContact: vi.fn() }),
}));
vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: () => ({ companies: [], loading: false, totalCount: 0, searchTerm: '', setSearchTerm: vi.fn(), createCompany: vi.fn(), updateCompany: vi.fn(), deleteCompany: vi.fn() }),
}));
vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({ interactions: [], loading: false, createInteraction: vi.fn(), updateInteraction: vi.fn(), deleteInteraction: vi.fn() }),
}));
vi.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    loading: false,
    totalCompanies: 5,
    totalContacts: 12,
    weeklyInteractions: 8,
    averageScore: 72,
    companyChange: '+2',
    contactChange: '+3',
    interactionChange: '+5',
    scoreChange: '+4%',
    topContacts: [],
    recentActivities: [],
  }),
}));
vi.mock('@/hooks/useCompatibilityAlerts', () => ({ useCompatibilityAlerts: () => {} }));
vi.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => false, default: () => false }));
vi.mock('@/hooks/useStaggerAnimation', () => ({
  useStaggerAnimation: () => [],
}));
vi.mock('@/types/behavior', () => ({ getBehavior: () => null }));

// Mock layout and dashboard components
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/dashboard/ScrollProgressBar', () => ({ ScrollProgressBar: () => <div data-testid="scroll-progress" /> }));
vi.mock('@/components/dashboard/WelcomeHeroCard', () => ({ WelcomeHeroCard: ({ totalContacts, weeklyInteractions, averageScore }: any) => <div data-testid="welcome-hero">Contacts: {totalContacts}</div> }));
vi.mock('@/components/dashboard/OnboardingChecklist', () => ({ OnboardingChecklist: ({ hasContacts }: any) => <div data-testid="onboarding-checklist">Has contacts: {String(hasContacts)}</div> }));
vi.mock('@/components/dashboard/LazySection', () => ({ LazySection: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/dashboard/DashboardErrorBoundary', () => ({ DashboardErrorBoundary: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/dashboard/YourDaySection', () => ({ YourDaySection: () => <div data-testid="your-day" /> }));
vi.mock('@/components/briefing/PreContactBriefing', () => ({ PreContactBriefing: () => <div data-testid="pre-contact-briefing" /> }));
vi.mock('@/components/quick-actions/FloatingQuickActions', () => ({ FloatingQuickActions: () => <div data-testid="floating-actions" /> }));
vi.mock('@/components/skeletons/DashboardSkeleton', () => ({ default: () => <div data-testid="dashboard-skeleton" /> }));
vi.mock('@/components/ui/stat-card', () => ({ StatCard: ({ title, value }: any) => <div data-testid="stat-card">{title}: {value}</div> }));
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  SearchEmptyState: ({ searchTerm }: any) => <div data-testid="search-empty-state">{searchTerm}</div>,
}));
vi.mock('@/components/dashboard/DashboardCharts', () => ({
  ActivityChart: () => <div data-testid="activity-chart" />,
  RelationshipEvolutionChart: () => <div data-testid="relationship-chart" />,
  ContactDistributionChart: () => <div data-testid="distribution-chart" />,
  RelationshipScoreChart: () => <div data-testid="score-chart" />,
  SentimentChart: () => <div data-testid="sentiment-chart" />,
}));

// Lazy-loaded components
vi.mock('@/components/smart-reminders/SmartRemindersPanel', () => ({ SmartRemindersPanel: () => <div data-testid="smart-reminders" /> }));
vi.mock('@/components/dashboard/RelationshipStatsPanel', () => ({ RelationshipStatsPanel: () => <div data-testid="relationship-stats" /> }));
vi.mock('@/components/dashboard/PortfolioHealthDashboard', () => ({ PortfolioHealthDashboard: () => <div data-testid="portfolio-health" /> }));
vi.mock('@/components/dashboard/HealthAlertsPanel', () => ({ HealthAlertsPanel: () => <div data-testid="health-alerts" /> }));
vi.mock('@/components/dashboard/ImportantDatesCalendar', () => ({ ImportantDatesCalendar: () => <div data-testid="important-dates" /> }));
vi.mock('@/components/triggers/CompatibilityAlertsList', () => ({ CompatibilityAlertsList: () => <div data-testid="compatibility-alerts" /> }));
vi.mock('@/components/analytics/ClosingScoreAlertsList', () => ({ ClosingScoreAlertsList: () => <div data-testid="closing-alerts" /> }));
vi.mock('@/components/analytics/ClosingScoreRanking', () => ({ ClosingScoreRanking: () => <div data-testid="closing-ranking" /> }));
vi.mock('@/components/analytics/ChurnPredictionPanel', () => ({ ChurnPredictionPanel: () => <div data-testid="churn-prediction" /> }));
vi.mock('@/components/analytics/BestTimeToContactPanel', () => ({ BestTimeToContactPanel: () => <div data-testid="best-time" /> }));
vi.mock('@/components/analytics/DealVelocityPanel', () => ({ DealVelocityPanel: () => <div data-testid="deal-velocity" /> }));
vi.mock('@/components/analytics/PurchasePatternsPanel', () => ({ PurchasePatternsPanel: () => <div data-testid="purchase-patterns" /> }));
vi.mock('@/components/analytics/BehaviorAlertsPanel', () => ({ BehaviorAlertsPanel: () => <div data-testid="behavior-alerts" /> }));
vi.mock('@/components/analytics/RFMAnalysisPanel', () => ({ RFMAnalysisPanel: () => <div data-testid="rfm-analysis" /> }));
vi.mock('@/components/disc', () => ({ DISCCompatibilityAlerts: () => <div data-testid="disc-alerts" /> }));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-${value}`}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`trigger-${value}`}>{children}</button>,
}));
vi.mock('@/components/ui/optimized-avatar', () => ({ OptimizedAvatar: () => <div data-testid="avatar" /> }));
vi.mock('@/components/ui/role-badge', () => ({ RoleBadge: ({ role }: any) => <span>{role}</span> }));
vi.mock('@/components/ui/relationship-score', () => ({ RelationshipScore: ({ score }: any) => <span>{score}</span> }));
vi.mock('@/components/ui/sentiment-indicator', () => ({ SentimentIndicator: ({ sentiment }: any) => <span>{sentiment}</span> }));
vi.mock('@/components/ui/surface', () => ({ Surface: ({ children, ...props }: any) => <div {...props}>{children}</div> }));
vi.mock('@/components/ui/typography', () => ({
  Typography: ({ children }: any) => <span>{children}</span>,
}));

import Dashboard from '../Index';

describe('Dashboard (Index) Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Dashboard header with correct title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows the subtitle', () => {
    render(<Dashboard />);
    expect(screen.getByText('Visão geral do seu relacionamento com clientes')).toBeInTheDocument();
  });

  it('renders the WelcomeHeroCard with stats', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('welcome-hero')).toBeInTheDocument();
    expect(screen.getByText('Contacts: 12')).toBeInTheDocument();
  });

  it('renders the OnboardingChecklist', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('onboarding-checklist')).toBeInTheDocument();
  });

  it('renders stat cards with correct values', () => {
    render(<Dashboard />);
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBe(4);
    expect(screen.getByText('Total de Empresas: 5')).toBeInTheDocument();
    expect(screen.getByText('Contatos Cadastrados: 12')).toBeInTheDocument();
  });

  it('renders the scroll progress bar', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
  });

  it('renders dashboard tabs', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-overview')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-relationships')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-intelligence')).toBeInTheDocument();
  });

  it('renders the floating quick actions', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('floating-actions')).toBeInTheDocument();
  });

  it('renders PreContactBriefing section', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('pre-contact-briefing')).toBeInTheDocument();
  });

  it('renders YourDaySection', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('your-day')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', async () => {
    const { useDashboardStats } = await import('@/hooks/useDashboardStats');
    vi.mocked(useDashboardStats).mockReturnValue({
      loading: true,
      totalCompanies: 0,
      totalContacts: 0,
      weeklyInteractions: 0,
      averageScore: 0,
      companyChange: '0',
      contactChange: '0',
      interactionChange: '0',
      scoreChange: '0',
      topContacts: [],
      recentActivities: [],
    } as any);

    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });
});
