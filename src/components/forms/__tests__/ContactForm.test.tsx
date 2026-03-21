import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContactForm } from '../ContactForm';

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
vi.mock('@/components/ui/masked-input', () => ({
  PhoneInput: ({ value, onChange, ...props }: any) => (
    <input data-testid="phone-input" value={value} onChange={(e: any) => onChange(e.target.value)} {...props} />
  ),
}));

const mockCompanies = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Company A', user_id: 'test-user' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Company B', user_id: 'test-user' },
];

const mockContact = {
  id: 'contact-1',
  first_name: 'Maria',
  last_name: 'Silva',
  email: 'maria@test.com',
  phone: '11999999999',
  whatsapp: '11999999999',
  role: 'manager',
  role_title: 'Diretora',
  company_id: '11111111-1111-1111-1111-111111111111',
  linkedin: 'linkedin.com/in/maria',
  instagram: '@maria',
  birthday: '1990-05-15',
  relationship_stage: 'customer',
  notes: 'Important contact',
  user_id: 'test-user',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('ContactForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders new contact form with heading', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Novo Contato')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados do contato')).toBeInTheDocument();
  });

  it('renders edit contact form with heading when contact is provided', () => {
    render(
      <ContactForm
        contact={mockContact as any}
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Editar Contato')).toBeInTheDocument();
    expect(screen.getByText('Atualize as informações do contato')).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Nome *')).toBeInTheDocument();
    expect(screen.getByText('Sobrenome *')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Cargo')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Notas')).toBeInTheDocument();
  });

  it('renders Cancelar and Criar Contato buttons for new contact', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Criar Contato')).toBeInTheDocument();
  });

  it('renders Salvar Alterações button for existing contact', () => {
    render(
      <ContactForm
        contact={mockContact as any}
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('populates form fields with contact data in edit mode', () => {
    render(
      <ContactForm
        contact={mockContact as any}
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByPlaceholderText('João')).toHaveValue('Maria');
    expect(screen.getByPlaceholderText('Silva')).toHaveValue('Silva');
    expect(screen.getByPlaceholderText('joao@empresa.com.br')).toHaveValue('maria@test.com');
  });

  it('calls onCancel when Cancelar button is clicked', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    expect(screen.getByText('Criar Contato').closest('button')).toBeDisabled();
  });

  it('renders the Tipo de Contato select field', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Tipo de Contato')).toBeInTheDocument();
  });

  it('renders the Estágio do Relacionamento select field', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Estágio do Relacionamento')).toBeInTheDocument();
  });

  it('renders the Aniversário field', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Aniversário')).toBeInTheDocument();
  });

  it('renders phone hint text', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Digite apenas os números')).toBeInTheDocument();
  });

  it('allows typing in the name fields', () => {
    render(
      <ContactForm
        companies={mockCompanies as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    const firstNameInput = screen.getByPlaceholderText('João');
    fireEvent.change(firstNameInput, { target: { value: 'Carlos' } });
    expect(firstNameInput).toHaveValue('Carlos');
  });
});
