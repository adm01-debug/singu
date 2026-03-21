import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractionForm } from '../InteractionForm';

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
vi.mock('@/components/voice/VoiceInput', () => ({
  VoiceInput: ({ placeholder }: any) => <button data-testid="voice-input">{placeholder}</button>,
}));

const mockContacts = [
  { id: 'c1111111-1111-1111-1111-111111111111', first_name: 'João', last_name: 'Silva', company_id: 'comp-1', user_id: 'test-user' },
  { id: 'c2222222-2222-2222-2222-222222222222', first_name: 'Ana', last_name: 'Santos', company_id: null, user_id: 'test-user' },
];

const mockInteraction = {
  id: 'int-1',
  contact_id: 'c1111111-1111-1111-1111-111111111111',
  company_id: 'comp-1',
  type: 'call',
  title: 'Follow-up meeting',
  content: 'Discussed project timelines',
  sentiment: 'positive',
  initiated_by: 'us',
  duration: 1800,
  follow_up_required: true,
  follow_up_date: '2024-03-15',
  user_id: 'test-user',
  created_at: '2024-01-01',
};

describe('InteractionForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders new interaction form with heading', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Nova Interação')).toBeInTheDocument();
    expect(screen.getByText('Registre uma nova interação')).toBeInTheDocument();
  });

  it('renders edit interaction form with heading when interaction is provided', () => {
    render(
      <InteractionForm
        interaction={mockInteraction as any}
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Editar Interação')).toBeInTheDocument();
    expect(screen.getByText('Atualize os detalhes da interação')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Contato *')).toBeInTheDocument();
    expect(screen.getByText('Tipo *')).toBeInTheDocument();
    expect(screen.getByText('Título *')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Sentimento')).toBeInTheDocument();
    expect(screen.getByText('Iniciado por')).toBeInTheDocument();
    expect(screen.getByText('Duração (minutos)')).toBeInTheDocument();
    expect(screen.getByText('Requer follow-up')).toBeInTheDocument();
  });

  it('renders Registrar Interação button for new interaction', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Registrar Interação')).toBeInTheDocument();
  });

  it('renders Salvar Alterações button for existing interaction', () => {
    render(
      <InteractionForm
        interaction={mockInteraction as any}
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('calls onCancel when Cancelar button is clicked', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );
    expect(screen.getByText('Registrar Interação').closest('button')).toBeDisabled();
  });

  it('populates title field with interaction data in edit mode', () => {
    render(
      <InteractionForm
        interaction={mockInteraction as any}
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    const titleInput = screen.getByPlaceholderText('Ex: Discussão sobre proposta comercial');
    expect(titleInput).toHaveValue('Follow-up meeting');
  });

  it('renders voice input button', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByTestId('voice-input')).toBeInTheDocument();
  });

  it('renders voice hint text', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Use o microfone para adicionar notas por voz')).toBeInTheDocument();
  });

  it('allows typing in the title field', () => {
    render(
      <InteractionForm
        contacts={mockContacts as any}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    const titleInput = screen.getByPlaceholderText('Ex: Discussão sobre proposta comercial');
    fireEvent.change(titleInput, { target: { value: 'New meeting' } });
    expect(titleInput).toHaveValue('New meeting');
  });
});
