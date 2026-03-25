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
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis() })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis(), unsubscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/empresas', search: '', hash: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockCompanies = [
  { id: 'c1', name: 'Tech Corp', industry: 'Tecnologia', state: 'SP', financial_health: 'good', created_at: '2024-01-01', updated_at: '2024-01-02', tags: [] },
  { id: 'c2', name: 'Health Inc', industry: 'Saúde', state: 'RJ', financial_health: 'excellent', created_at: '2024-01-01', updated_at: '2024-01-02', tags: [] },
];

vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: () => ({ companies: mockCompanies, loading: false, totalCount: 2, searchTerm: '', setSearchTerm: vi.fn(), createCompany: vi.fn(), updateCompany: vi.fn(), deleteCompany: vi.fn() }),
}));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({
  useKeyboardShortcutsEnhanced: () => {},
  useListNavigation: () => ({ selectedIndex: -1, setSelectedIndex: vi.fn() }),
}));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/quick-actions/FloatingQuickActions', () => ({ FloatingQuickActions: () => null }));
vi.mock('@/components/data-export/AdvancedDataExporter', () => ({ AdvancedDataExporter: () => null }));
vi.mock('@/components/recently-viewed/RecentlyViewedSection', () => ({ RecentlyViewedSection: () => null }));
vi.mock('@/components/filters/AdvancedFilters', () => ({ AdvancedFilters: () => <div data-testid="advanced-filters" /> }));
vi.mock('@/components/forms/CompanyForm', () => ({ CompanyForm: () => <div data-testid="company-form" /> }));
vi.mock('@/components/company-card/CompanyCardWithContext', () => ({ CompanyCardWithContext: ({ company }: any) => <div data-testid="company-card">{company.name}</div> }));
vi.mock('@/components/bulk-actions/BulkActionsBar', () => ({ BulkActionsBar: () => null }));
vi.mock('@/components/skeletons/PageSkeletons', () => ({
  CompaniesGridSkeleton: () => <div data-testid="companies-skeleton" />,
}));
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  SearchEmptyState: ({ searchTerm }: any) => <div data-testid="search-empty">{searchTerm}</div>,
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  AlertDialogAction: ({ children }: any) => <button>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

import Empresas from '../Empresas';

describe('Empresas Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Empresas />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Empresas header', () => {
    render(<Empresas />);
    expect(screen.getByText('Empresas')).toBeInTheDocument();
  });

  it('displays company count in subtitle', () => {
    render(<Empresas />);
    expect(screen.getByText('2 de 2 empresas')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Empresas />);
    expect(screen.getByPlaceholderText(/Buscar empresa/)).toBeInTheDocument();
  });

  it('renders advanced filters', () => {
    render(<Empresas />);
    expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
  });

  it('renders company cards', () => {
    render(<Empresas />);
    const cards = screen.getAllByTestId('company-card');
    expect(cards.length).toBe(2);
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Health Inc')).toBeInTheDocument();
  });

  it('has selection mode toggle', () => {
    render(<Empresas />);
    expect(screen.getByText('Selecionar')).toBeInTheDocument();
  });

  it('renders within app layout', () => {
    render(<Empresas />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders the header', () => {
    render(<Empresas />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
