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
vi.mock('@/types/neuromarketing', () => ({
  Neurochemical: {},
}));
vi.mock('@/data/neuromarketingData', () => ({
  NEUROCHEMICAL_INFO: {
    dopamine: { name: 'Dopamina', color: '#ff0', description: 'Recompensa' },
    oxytocin: { name: 'Ocitocina', color: '#f0f', description: 'Confiança' },
    serotonin: { name: 'Serotonina', color: '#0f0', description: 'Status' },
    cortisol: { name: 'Cortisol', color: '#f00', description: 'Urgência' },
    endorphin: { name: 'Endorfina', color: '#0ff', description: 'Prazer' },
    adrenaline: { name: 'Adrenalina', color: '#f80', description: 'Excitação' },
  },
}));

import NeurochemicalInfluenceMap from '../NeurochemicalInfluenceMap';

describe('NeurochemicalInfluenceMap', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText('Mapa de Influência Neuroquímica')).toBeInTheDocument();
  });

  it('shows dopamine chemical', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Dopamina/i)).toBeInTheDocument();
  });

  it('shows oxytocin chemical', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Ocitocina/i)).toBeInTheDocument();
  });

  it('shows serotonin chemical', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Serotonina/i)).toBeInTheDocument();
  });

  it('shows cortisol chemical', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Cortisol/i)).toBeInTheDocument();
  });

  it('shows sales tactics for chemicals', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Revele benefícios|surpresa|exclusivo/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeurochemicalInfluenceMap className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts highlightChemical prop', () => {
    const { container } = render(<NeurochemicalInfluenceMap highlightChemical="dopamine" />);
    expect(container).toBeTruthy();
  });

  it('accepts onSelectChemical callback', () => {
    const onSelect = vi.fn();
    const { container } = render(<NeurochemicalInfluenceMap onSelectChemical={onSelect} />);
    expect(container).toBeTruthy();
  });

  it('shows triggers for each chemical', () => {
    render(<NeurochemicalInfluenceMap />);
    expect(screen.getByText(/Novidades|Recompensas|Gamificação/)).toBeInTheDocument();
  });
});
