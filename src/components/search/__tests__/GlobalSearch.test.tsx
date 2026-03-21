import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalSearch } from '../GlobalSearch';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  isMacOS: () => false,
}));
vi.mock('fuse.js', () => ({
  default: class {
    constructor() {}
    search() { return []; }
    static config = { getFn: (obj: any, path: any) => { if (Array.isArray(path)) return path.reduce((o: any, k: any) => o?.[k], obj); return obj?.[path]; } };
  },
}));

describe('GlobalSearch', () => {
  it('does not render when closed', () => {
    render(<GlobalSearch open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Super Command Palette')).not.toBeInTheDocument();
  });

  it('renders command palette when open', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Super Command Palette')).toBeInTheDocument();
  });

  it('renders search input placeholder', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Buscar contatos, empresas, navegar ou executar ações...')).toBeInTheDocument();
  });

  it('renders quick actions section', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Novo Contato')).toBeInTheDocument();
    expect(screen.getByText('Nova Empresa')).toBeInTheDocument();
    expect(screen.getByText('Nova Interação')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Contatos')).toBeInTheDocument();
  });

  it('renders keyboard hints in footer', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('navegar')).toBeInTheDocument();
    expect(screen.getByText('selecionar')).toBeInTheDocument();
    expect(screen.getByText('fechar')).toBeInTheDocument();
  });

  it('renders quick action descriptions', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Adicionar um novo contato à sua rede')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar uma nova empresa')).toBeInTheDocument();
  });

  it('renders navigation descriptions', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Visão geral e métricas')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar empresas')).toBeInTheDocument();
  });

  it('renders keyboard shortcut labels for quick actions', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Alt+C')).toBeInTheDocument();
    expect(screen.getByText('Alt+E')).toBeInTheDocument();
    expect(screen.getByText('Alt+I')).toBeInTheDocument();
  });

  it('renders mod key indicator in footer', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Abrir com')).toBeInTheDocument();
  });

  it('renders Configurações in navigation items', () => {
    render(<GlobalSearch open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Preferências do sistema')).toBeInTheDocument();
  });
});
