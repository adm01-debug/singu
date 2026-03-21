import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanyForm } from '../CompanyForm';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Test' } } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to, className }: any) => <a href={to} className={typeof className === 'function' ? className({ isActive: false }) : className}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));
vi.mock('@/hooks/useFormDraft', () => ({
  useFormDraft: () => ({ clearDraft: vi.fn(), hasDraft: false }),
}));

const mockCompany = {
  id: 'company-1',
  name: 'Tech Corp',
  industry: 'Tecnologia',
  website: 'https://techcorp.com',
  phone: '1133334444',
  email: 'contato@techcorp.com',
  address: 'Av. Paulista, 1000',
  city: 'São Paulo',
  state: 'SP',
  employee_count: '51-100',
  annual_revenue: 'R$ 5M',
  financial_health: 'growing',
  notes: 'Great company',
  user_id: 'test-user',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('CompanyForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders new company form with heading', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Nova Empresa')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados da empresa')).toBeInTheDocument();
  });

  it('renders edit company form with heading when company is provided', () => {
    render(<CompanyForm company={mockCompany as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Atualize as informações da empresa')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Nome da Empresa *')).toBeInTheDocument();
    expect(screen.getByText('Segmento')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Endereço')).toBeInTheDocument();
    expect(screen.getByText('Cidade')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Faturamento Anual')).toBeInTheDocument();
    expect(screen.getByText('Notas')).toBeInTheDocument();
  });

  it('renders Criar Empresa button for new company', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Criar Empresa')).toBeInTheDocument();
  });

  it('renders Salvar Alterações button for existing company', () => {
    render(<CompanyForm company={mockCompany as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('populates form fields with company data in edit mode', () => {
    render(<CompanyForm company={mockCompany as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByPlaceholderText('Ex: Tech Solutions LTDA')).toHaveValue('Tech Corp');
    expect(screen.getByPlaceholderText('Ex: Tecnologia')).toHaveValue('Tecnologia');
    expect(screen.getByPlaceholderText('https://exemplo.com.br')).toHaveValue('https://techcorp.com');
  });

  it('calls onCancel when Cancelar button is clicked', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);
    expect(screen.getByText('Criar Empresa').closest('button')).toBeDisabled();
  });

  it('renders Nº Funcionários select field', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Nº Funcionários')).toBeInTheDocument();
  });

  it('renders Saúde Financeira select field', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Saúde Financeira')).toBeInTheDocument();
  });

  it('allows typing in the company name field', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const nameInput = screen.getByPlaceholderText('Ex: Tech Solutions LTDA');
    fireEvent.change(nameInput, { target: { value: 'New Company' } });
    expect(nameInput).toHaveValue('New Company');
  });

  it('allows typing in city and state fields', () => {
    render(<CompanyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const cityInput = screen.getByPlaceholderText('São Paulo');
    const stateInput = screen.getByPlaceholderText('SP');
    fireEvent.change(cityInput, { target: { value: 'Rio de Janeiro' } });
    fireEvent.change(stateInput, { target: { value: 'RJ' } });
    expect(cityInput).toHaveValue('Rio de Janeiro');
    expect(stateInput).toHaveValue('RJ');
  });
});
