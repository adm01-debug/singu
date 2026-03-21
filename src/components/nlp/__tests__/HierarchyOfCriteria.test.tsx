import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
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
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/demo-contact', () => ({
  DEMO_CONTACT: { id: 'demo', firstName: 'Cliente', lastName: 'Exemplo', behavior: { discProfile: 'I' } }
}));

import HierarchyOfCriteria from '../HierarchyOfCriteria';

describe('HierarchyOfCriteria', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<HierarchyOfCriteria />);
    expect(screen.getByText('Hierarquia de Critérios')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<HierarchyOfCriteria />);
    expect(screen.getByText(/Nenhum critério adicionado ainda/)).toBeInTheDocument();
  });

  it('shows common criteria suggestions', () => {
    render(<HierarchyOfCriteria />);
    expect(screen.getByText(/Preço|Qualidade|Confiança/)).toBeInTheDocument();
  });

  it('renders add criterion input', () => {
    render(<HierarchyOfCriteria />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts className prop', () => {
    const { container } = render(<HierarchyOfCriteria className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('calls onCriteriaChange when criteria added', () => {
    const onChange = vi.fn();
    render(<HierarchyOfCriteria onCriteriaChange={onChange} />);
    const suggestion = screen.getByText('Preço/Custo');
    fireEvent.click(suggestion);
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with initial criteria', () => {
    const criteria = [{ id: '1', name: 'Preço', importance: 1 }];
    render(<HierarchyOfCriteria initialCriteria={criteria} />);
    expect(screen.getByText('Preço')).toBeInTheDocument();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<HierarchyOfCriteria />);
    expect(container).toBeTruthy();
  });
});
