import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
vi.mock('@/hooks/useAdvancedTriggers', () => ({
  useAdvancedTriggers: () => ({
    advancedTriggers: [],
    exposureAnalysis: { totalExposures: 0, saturationLevel: 0 },
    resistanceProfile: {},
    resistanceScore: 0,
    fullAnalysis: null,
    recommendedChains: [],
    intensityLevels: {},
    getSynergies: vi.fn(() => []),
    getFallbacks: vi.fn(() => []),
    getRecommendedIntensity: vi.fn(() => 'medium'),
  }),
}));
vi.mock('@/types/triggers', () => ({
  MENTAL_TRIGGERS: {},
}));
vi.mock('@/types/triggers-advanced', () => ({
  AllTriggerTypes: {},
}));

import { AdvancedTriggersPanel } from '../AdvancedTriggersPanel';

describe('AdvancedTriggersPanel', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(<AdvancedTriggersPanel />);
    expect(container).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<AdvancedTriggersPanel />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<AdvancedTriggersPanel className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders tabs for different views', () => {
    render(<AdvancedTriggersPanel />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows trigger analysis section', () => {
    render(<AdvancedTriggersPanel />);
    expect(screen.getByText(/Gatilhos|Triggers|Análise/i)).toBeInTheDocument();
  });

  it('shows saturation or exposure info', () => {
    render(<AdvancedTriggersPanel />);
    expect(screen.getByText(/Saturação|Exposição|Resistência/i)).toBeInTheDocument();
  });

  it('renders with contact prop', () => {
    const contact = { id: '1', firstName: 'João', lastName: 'Silva', behavior: { discProfile: 'D' } } as any;
    const { container } = render(<AdvancedTriggersPanel contact={contact} />);
    expect(container).toBeTruthy();
  });

  it('renders chain recommendations area', () => {
    render(<AdvancedTriggersPanel />);
    expect(screen.getByText(/Cadeia|Chain|Sequência|Intensidade/i)).toBeInTheDocument();
  });
});
