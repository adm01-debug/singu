import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));

const mockUseBestTimeToContact = vi.fn();
vi.mock('@/hooks/useBestTimeToContact', () => ({
  useBestTimeToContact: (...args: any[]) => mockUseBestTimeToContact(...args),
}));

import { BestTimeToContactPanel } from '../BestTimeToContactPanel';

describe('BestTimeToContactPanel', () => {
  const defaultMock = {
    analysis: null,
    globalPatterns: null,
    loading: false,
  };

  beforeEach(() => {
    mockUseBestTimeToContact.mockReturnValue(defaultMock);
  });

  it('renders without crashing', () => {
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('Melhor Horário para Contato')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    mockUseBestTimeToContact.mockReturnValue({ ...defaultMock, loading: true });
    const { container } = render(<BestTimeToContactPanel />);
    const skeletons = container.querySelectorAll('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no analysis or global patterns', () => {
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('Dados insuficientes')).toBeInTheDocument();
    expect(screen.getByText('Registre mais interações para análise')).toBeInTheDocument();
  });

  it('shows global patterns title when no contactId', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Manhãs são mais produtivas',
        recommendation: 'Prefira contatos pela manhã',
        bestDays: [],
        bestHours: [],
        bestTimeSlots: [],
      },
    });
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('Padrões de Horário Global')).toBeInTheDocument();
  });

  it('shows contact-specific title when contactId is provided', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Pattern',
        recommendation: 'Rec',
        bestDays: [],
        bestHours: [],
        bestTimeSlots: [],
      },
    });
    render(<BestTimeToContactPanel contactId="123" />);
    expect(screen.getByText('Melhor Horário para Este Contato')).toBeInTheDocument();
  });

  it('displays overall pattern', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Manhãs são ideais',
        recommendation: 'Ligue entre 9h e 11h',
        bestDays: [],
        bestHours: [],
        bestTimeSlots: [],
      },
    });
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('Manhãs são ideais')).toBeInTheDocument();
    expect(screen.getByText('Ligue entre 9h e 11h')).toBeInTheDocument();
  });

  it('renders best days', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Test',
        recommendation: 'Test',
        bestDays: [
          { day: 'Segunda', score: 85 },
          { day: 'Terça', score: 75 },
          { day: 'Quarta', score: 65 },
        ],
        bestHours: [],
        bestTimeSlots: [],
      },
    });
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('Segunda')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Melhores Dias')).toBeInTheDocument();
  });

  it('renders best hours', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Test',
        recommendation: 'Test',
        bestDays: [],
        bestHours: [
          { hour: '09:00', score: 90 },
          { hour: '10:00', score: 80 },
        ],
        bestTimeSlots: [],
      },
    });
    render(<BestTimeToContactPanel />);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('Melhores Horários')).toBeInTheDocument();
  });

  it('shows global patterns overview', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Test',
        recommendation: 'Test',
        bestDays: [],
        bestHours: [],
        bestTimeSlots: [],
      },
      globalPatterns: {
        peakActivityHour: '10:00',
        peakActivityDay: 'Terça',
        optimalContactHour: '09:30',
      },
    });
    render(<BestTimeToContactPanel compact={false} />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Pico de Atividade')).toBeInTheDocument();
  });

  it('hides global patterns in compact mode', () => {
    mockUseBestTimeToContact.mockReturnValue({
      ...defaultMock,
      analysis: {
        overallPattern: 'Test',
        recommendation: 'Test',
        bestDays: [],
        bestHours: [],
        bestTimeSlots: [],
      },
      globalPatterns: {
        peakActivityHour: '10:00',
        peakActivityDay: 'Terça',
        optimalContactHour: '09:30',
      },
    });
    render(<BestTimeToContactPanel compact={true} />);
    expect(screen.queryByText('Pico de Atividade')).not.toBeInTheDocument();
  });
});
