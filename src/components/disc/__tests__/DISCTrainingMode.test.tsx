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
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null,
  Tooltip: () => null, Legend: () => null,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/data/discAdvancedData', () => ({
  DISC_PROFILES: {
    D: { name: 'Dominante', color: { bg: '#f00', text: '#fff' } },
    I: { name: 'Influente', color: { bg: '#ff0', text: '#000' } },
    S: { name: 'Estável', color: { bg: '#0f0', text: '#000' } },
    C: { name: 'Consciente', color: { bg: '#00f', text: '#fff' } },
  },
}));

import DISCTrainingMode from '../DISCTrainingMode';

describe('DISCTrainingMode', () => {
  it('renders the training title', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText('Modo Treinamento DISC')).toBeInTheDocument();
  });

  it('shows scenario counter badge', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText(/1\/6/)).toBeInTheDocument();
  });

  it('displays the first scenario situation', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText(/Apresentação de proposta para um CEO impaciente/)).toBeInTheDocument();
  });

  it('renders client statement in quotes', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText(/não tenho muito tempo/)).toBeInTheDocument();
  });

  it('shows "Como você responde?" prompt', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText('Como você responde?')).toBeInTheDocument();
  });

  it('renders four answer options', () => {
    render(<DISCTrainingMode />);
    expect(screen.getByText(/Vou direto ao ponto/)).toBeInTheDocument();
    expect(screen.getByText(/contar uma história/)).toBeInTheDocument();
  });

  it('has a disabled confirm button initially', () => {
    render(<DISCTrainingMode />);
    const btn = screen.getByText('Confirmar Resposta');
    expect(btn.closest('button')).toBeDisabled();
  });

  it('enables confirm button when an option is selected', () => {
    render(<DISCTrainingMode />);
    const option = screen.getByText(/Vou direto ao ponto/);
    fireEvent.click(option);
    const btn = screen.getByText('Confirmar Resposta');
    expect(btn.closest('button')).not.toBeDisabled();
  });

  it('shows result after confirming answer', () => {
    render(<DISCTrainingMode />);
    fireEvent.click(screen.getByText(/Vou direto ao ponto/));
    fireEvent.click(screen.getByText('Confirmar Resposta'));
    expect(screen.getByText(/Excelente!/)).toBeInTheDocument();
  });

  it('shows next scenario button after answering', () => {
    render(<DISCTrainingMode />);
    fireEvent.click(screen.getByText(/Vou direto ao ponto/));
    fireEvent.click(screen.getByText('Confirmar Resposta'));
    expect(screen.getByText('Próximo Cenário')).toBeInTheDocument();
  });

  it('shows learning point after answering', () => {
    render(<DISCTrainingMode />);
    fireEvent.click(screen.getByText(/Vou direto ao ponto/));
    fireEvent.click(screen.getByText('Confirmar Resposta'));
    expect(screen.getByText(/perfis Dominantes/)).toBeInTheDocument();
  });

  it('calls onProgress callback when provided', () => {
    const onProgress = vi.fn();
    render(<DISCTrainingMode onProgress={onProgress} />);
    fireEvent.click(screen.getByText(/Vou direto ao ponto/));
    fireEvent.click(screen.getByText('Confirmar Resposta'));
    expect(onProgress).toHaveBeenCalled();
  });
});
