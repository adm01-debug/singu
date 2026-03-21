import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '../Header';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/ui/typography', () => ({
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('./PersonalizedGreeting', () => ({
  PersonalizedGreeting: () => <div data-testid="greeting">Greeting</div>,
}));

describe('Header', () => {
  it('renders the title', () => {
    render(<Header title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<Header title="Dashboard" subtitle="Welcome back" />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<Header title="Dashboard" />);
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('renders notifications link', () => {
    render(<Header title="Dashboard" />);
    const notifButton = screen.getByLabelText('Notificações');
    expect(notifButton).toBeInTheDocument();
  });

  it('renders add button when showAddButton is true', () => {
    const onAdd = vi.fn();
    render(<Header title="Contatos" showAddButton addButtonLabel="Novo Contato" onAddClick={onAdd} />);
    expect(screen.getByText('Novo Contato')).toBeInTheDocument();
  });

  it('calls onAddClick when add button is clicked', () => {
    const onAdd = vi.fn();
    render(<Header title="Contatos" showAddButton addButtonLabel="Novo Contato" onAddClick={onAdd} />);
    fireEvent.click(screen.getByText('Novo Contato'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('uses default label Adicionar when addButtonLabel is not provided', () => {
    render(<Header title="Test" showAddButton onAddClick={vi.fn()} />);
    expect(screen.getByText('Adicionar')).toBeInTheDocument();
  });

  it('does not render add button when showAddButton is false', () => {
    render(<Header title="Test" />);
    expect(screen.queryByText('Adicionar')).not.toBeInTheDocument();
  });

  it('renders breadcrumb navigation when showBreadcrumbs is true', () => {
    render(
      <Header
        title="Detalhes"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contatos', href: '/contatos' }]}
      />
    );
    expect(screen.getByLabelText('breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('renders breadcrumb items as links when href is provided', () => {
    render(
      <Header
        title="Detalhes"
        breadcrumbs={[{ label: 'Home', href: '/' }]}
      />
    );
    const link = screen.getByText('Home');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/');
  });

  it('does not render breadcrumbs when showBreadcrumbs is false', () => {
    render(<Header title="Test" showBreadcrumbs={false} />);
    expect(screen.queryByLabelText('breadcrumb')).not.toBeInTheDocument();
  });

  it('links notifications to /notificacoes', () => {
    render(<Header title="Test" />);
    const notifLink = screen.getByLabelText('Notificações').closest('a');
    expect(notifLink).toHaveAttribute('href', '/notificacoes');
  });
});
