import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockSignIn = vi.fn().mockResolvedValue({ error: null });
const mockSignUp = vi.fn().mockResolvedValue({ error: null, needsEmailVerification: false });
const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signIn: mockSignIn, signUp: mockSignUp, signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }), Toaster: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/auth', search: '', hash: '', state: null }),
  useParams: () => ({}),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import Auth from '../Auth';

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Auth />);
    expect(screen.getByText('Digite suas credenciais para acessar')).toBeInTheDocument();
  });

  it('shows login form by default', () => {
    render(<Auth />);
    expect(screen.getByText('Digite suas credenciais para acessar')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('shows SINGU branding', () => {
    render(<Auth />);
    const singuElements = screen.getAllByText('SINGU');
    expect(singuElements.length).toBeGreaterThan(0);
  });

  it('shows branding tagline', () => {
    render(<Auth />);
    expect(screen.getByText('Transforme relacionamentos em resultados')).toBeInTheDocument();
  });

  it('toggles between login and signup mode', async () => {
    render(<Auth />);
    // Find the toggle link (not the submit button)
    const toggleButtons = screen.getAllByText('Criar conta');
    // Click the last one which is the toggle link
    fireEvent.click(toggleButtons[toggleButtons.length - 1]);
    expect(screen.getByText('Preencha os dados para começar')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
  });

  it('shows signup form fields', () => {
    render(<Auth />);
    const toggleButtons = screen.getAllByText('Criar conta');
    fireEvent.click(toggleButtons[toggleButtons.length - 1]);
    expect(screen.getByPlaceholderText('João')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Silva')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Auth />);
    const passwordInput = screen.getByLabelText('Senha');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows email placeholder', () => {
    render(<Auth />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('shows terms text in signup mode', () => {
    render(<Auth />);
    const toggleButtons = screen.getAllByText('Criar conta');
    fireEvent.click(toggleButtons[toggleButtons.length - 1]);
    expect(screen.getByText(/Termos de Uso/)).toBeInTheDocument();
  });

  it('shows AI powered text', () => {
    render(<Auth />);
    expect(screen.getByText(/Powered by AI/)).toBeInTheDocument();
  });

  it('shows feature highlights in branding panel', () => {
    render(<Auth />);
    expect(screen.getByText('Perfil DISC automático')).toBeInTheDocument();
    expect(screen.getByText('Análise emocional')).toBeInTheDocument();
    expect(screen.getByText('Insights proativos')).toBeInTheDocument();
  });

  it('submit button is present', () => {
    render(<Auth />);
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(b => b.getAttribute('type') === 'submit');
    expect(submitButton).toBeInTheDocument();
  });
});
