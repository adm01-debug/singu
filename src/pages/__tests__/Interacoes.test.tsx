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
  useLocation: () => ({ pathname: '/interacoes', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'shape') }) }));

const mockInteractions = [
  { id: 'i1', contact_id: 'c1', company_id: null, type: 'whatsapp', title: 'Reunião de alinhamento', content: 'Discutimos o projeto', sentiment: 'positive', follow_up_required: true, follow_up_date: '2024-02-01', tags: ['projeto'], key_insights: [], initiated_by: 'us', duration: 1800, response_time: null, attachments: [], created_at: '2024-01-15T10:00:00Z' },
  { id: 'i2', contact_id: 'c2', company_id: null, type: 'email', title: 'Proposta enviada', content: 'Enviamos proposta comercial', sentiment: 'neutral', follow_up_required: false, follow_up_date: null, tags: [], key_insights: [], initiated_by: 'us', duration: null, response_time: null, attachments: [], created_at: '2024-01-14T10:00:00Z' },
];

vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({ interactions: mockInteractions, loading: false, createInteraction: vi.fn(), updateInteraction: vi.fn(), deleteInteraction: vi.fn() }),
}));
vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({ contacts: [{ id: 'c1', first_name: 'Ana', last_name: 'Silva', avatar_url: null, role_title: 'CEO' }], loading: false }),
}));
vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: () => ({ results: mockInteractions, setQuery: vi.fn(), query: '', isSearching: false, clearSearch: vi.fn() }),
}));
vi.mock('@/lib/sorting-utils', () => ({ sortArray: (arr: any[]) => arr }));
vi.mock('@/components/celebrations/MiniCelebration', () => ({
  useMiniCelebration: () => ({ trigger: vi.fn(), MiniCelebrationComponent: null }),
}));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/filters/AdvancedFilters', () => ({ AdvancedFilters: () => <div data-testid="advanced-filters" /> }));
vi.mock('@/components/forms/InteractionForm', () => ({ InteractionForm: () => <div data-testid="interaction-form" /> }));
vi.mock('@/components/feedback/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/navigation/SmartBreadcrumbs', () => ({ SmartBreadcrumbs: () => <div data-testid="breadcrumbs" /> }));
vi.mock('@/components/micro-interactions/MorphingNumber', () => ({ MorphingNumber: ({ value, className }: any) => <span className={className}>{value}</span> }));
vi.mock('@/components/skeletons/PageSkeletons', () => ({
  InteractionsListSkeleton: () => <div data-testid="interactions-skeleton" />,
}));
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  SearchEmptyState: ({ searchTerm }: any) => <div data-testid="search-empty">{searchTerm}</div>,
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
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
vi.mock('@/components/ui/optimized-avatar', () => ({ OptimizedAvatar: () => <div data-testid="avatar" /> }));
vi.mock('@/components/ui/sentiment-indicator', () => ({ SentimentIndicator: () => <span data-testid="sentiment" /> }));
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
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

import Interacoes from '../Interacoes';

describe('Interacoes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Interacoes />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Interações header', () => {
    render(<Interacoes />);
    expect(screen.getByText('Interações')).toBeInTheDocument();
  });

  it('displays interaction count in subtitle', () => {
    render(<Interacoes />);
    expect(screen.getByText('2 de 2 interações')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<Interacoes />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups')).toBeInTheDocument();
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
  });

  it('shows total interaction count in stats', () => {
    render(<Interacoes />);
    expect(screen.getByText('2')).toBeInTheDocument(); // total count
  });

  it('renders search input', () => {
    render(<Interacoes />);
    expect(screen.getByPlaceholderText(/Buscar interações/)).toBeInTheDocument();
  });

  it('renders advanced filters', () => {
    render(<Interacoes />);
    expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
  });

  it('renders interaction items with titles', () => {
    render(<Interacoes />);
    expect(screen.getByText('Reunião de alinhamento')).toBeInTheDocument();
    expect(screen.getByText('Proposta enviada')).toBeInTheDocument();
  });

  it('shows follow-up badge for required follow-ups', () => {
    render(<Interacoes />);
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<Interacoes />);
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });
});
