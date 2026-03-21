import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test', last_name: 'User' } }, session: { access_token: 'token' }, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), promise: vi.fn() }), Toaster: () => null }));
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
  useLocation: () => ({ pathname: '/contatos', search: '', hash: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
  Navigate: () => null,
  Outlet: () => null,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { shapeFromPath: vi.fn(() => 'shape') }) }));

const mockContacts = [
  { id: '1', first_name: 'Ana', last_name: 'Silva', email: 'ana@test.com', phone: '123', company_id: 'c1', role: 'contact', relationship_score: 80, sentiment: 'positive', created_at: '2024-01-01', updated_at: '2024-01-02', tags: [], notes: '', avatar_url: null, whatsapp: null, linkedin: null, instagram: null, twitter: null, role_title: 'CEO', hobbies: [], interests: [], family_info: null, personal_notes: null, behavior: null, life_events: [], relationship_stage: 'client', birthday: null, user_id: 'test-user' },
  { id: '2', first_name: 'Carlos', last_name: 'Santos', email: 'carlos@test.com', phone: '456', company_id: 'c2', role: 'manager', relationship_score: 65, sentiment: 'neutral', created_at: '2024-01-01', updated_at: '2024-01-02', tags: [], notes: '', avatar_url: null, whatsapp: null, linkedin: null, instagram: null, twitter: null, role_title: 'Manager', hobbies: [], interests: [], family_info: null, personal_notes: null, behavior: null, life_events: [], relationship_stage: 'prospect', birthday: null, user_id: 'test-user' },
];

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({ contacts: mockContacts, loading: false, createContact: vi.fn(), updateContact: vi.fn(), deleteContact: vi.fn() }),
}));
vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: () => ({ companies: [{ id: 'c1', name: 'Company A' }, { id: 'c2', name: 'Company B' }], loading: false, totalCount: 2, searchTerm: '', setSearchTerm: vi.fn(), createCompany: vi.fn(), updateCompany: vi.fn(), deleteCompany: vi.fn() }),
}));
vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({ interactions: [], loading: false, createInteraction: vi.fn(), updateInteraction: vi.fn(), deleteInteraction: vi.fn() }),
}));
vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: () => ({ results: mockContacts, setQuery: vi.fn(), query: '', isSearching: false, clearSearch: vi.fn() }),
}));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({
  useKeyboardShortcutsEnhanced: () => {},
  useListNavigation: () => ({ selectedIndex: -1, setSelectedIndex: vi.fn() }),
}));
vi.mock('@/lib/sorting-utils', () => ({ sortArray: (arr: any[]) => arr }));
vi.mock('react-window', () => ({ List: ({ children }: any) => <div>{children}</div> }));

vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title, subtitle }: any) => <div data-testid="header"><h1>{title}</h1><p>{subtitle}</p></div> }));
vi.mock('@/components/quick-actions/FloatingQuickActions', () => ({ FloatingQuickActions: () => null }));
vi.mock('@/components/data-export/AdvancedDataExporter', () => ({ AdvancedDataExporter: () => null }));
vi.mock('@/components/recently-viewed/RecentlyViewedSection', () => ({ RecentlyViewedSection: () => null }));
vi.mock('@/components/filters/AdvancedFilters', () => ({ AdvancedFilters: () => <div data-testid="advanced-filters" /> }));
vi.mock('@/components/forms/ContactForm', () => ({ ContactForm: () => <div data-testid="contact-form" /> }));
vi.mock('@/components/contact-card/ContactCardWithContext', () => ({ ContactCardWithContext: ({ contact }: any) => <div data-testid="contact-card">{contact.first_name} {contact.last_name}</div> }));
vi.mock('@/components/bulk-actions/BulkActionsBar', () => ({ BulkActionsBar: () => null }));
vi.mock('@/components/keyboard/KeyboardShortcutsCheatsheet', () => ({ KeyboardShortcutsCheatsheet: () => null }));
vi.mock('@/components/help/ContextualHelpTooltip', () => ({ ContextualHelpTooltip: () => null }));
vi.mock('@/components/feedback/AriaLiveRegion', () => ({ useAriaLiveRegion: () => ({ announce: vi.fn() }) }));
vi.mock('@/components/celebrations/MiniCelebration', () => ({
  useMiniCelebration: () => ({ trigger: vi.fn(), MiniCelebrationComponent: null }),
}));
vi.mock('@/components/search/SearchPresetsMenu', () => ({ SearchPresetsMenu: () => null }));
vi.mock('@/components/feedback/FeatureSpotlight', () => ({ FeatureSpotlight: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/skeletons/PageSkeletons', () => ({
  ContactsGridSkeleton: () => <div data-testid="contacts-skeleton" />,
  ContactsListSkeleton: () => <div data-testid="contacts-list-skeleton" />,
}));
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  SearchEmptyState: ({ searchTerm }: any) => <div data-testid="search-empty">{searchTerm}</div>,
}));
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
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

import Contatos from '../Contatos';

describe('Contatos Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Contatos />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('shows the Contatos header', () => {
    render(<Contatos />);
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('displays contact count in subtitle', () => {
    render(<Contatos />);
    expect(screen.getByText('2 de 2 pessoas')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Contatos />);
    expect(screen.getByPlaceholderText(/Buscar por nome/)).toBeInTheDocument();
  });

  it('renders advanced filters', () => {
    render(<Contatos />);
    expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
  });

  it('renders contact cards for each contact', () => {
    render(<Contatos />);
    const cards = screen.getAllByTestId('contact-card');
    expect(cards.length).toBe(2);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Carlos Santos')).toBeInTheDocument();
  });

  it('has selection mode toggle button', () => {
    render(<Contatos />);
    expect(screen.getByText('Selecionar')).toBeInTheDocument();
  });

  it('has grid/list view toggle buttons', () => {
    render(<Contatos />);
    expect(screen.getByLabelText('Visualização em grade')).toBeInTheDocument();
    expect(screen.getByLabelText('Visualização em lista')).toBeInTheDocument();
  });

  it('has enrich contacts button', () => {
    render(<Contatos />);
    expect(screen.getByText('Enriquecer')).toBeInTheDocument();
  });

  it('renders the header with add button', () => {
    render(<Contatos />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
