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
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  RadarChart: ({ children }: any) => <div>{children}</div>,
  Radar: () => null, PolarGrid: () => null, PolarAngleAxis: () => null, PolarRadiusAxis: () => null,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/hooks/useNeuromarketing', () => ({
  useNeuromarketing: () => ({
    analyzeText: vi.fn(() => ({ brainSystemScores: { reptilian: 30, limbic: 40, neocortex: 30 } })),
    generateNeuroProfileFromDISC: vi.fn(() => ({ brainBalance: { reptilian: 33, limbic: 34, neocortex: 33 } })),
    BRAIN_SYSTEM_INFO: {
      reptilian: { name: 'Reptiliano', color: '#f00' },
      limbic: { name: 'Límbico', color: '#0f0' },
      neocortex: { name: 'Neocórtex', color: '#00f' },
    },
  }),
}));
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {},
}));

import NeuroRadarChart from '../NeuroRadarChart';

describe('NeuroRadarChart', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the default title', () => {
    render(<NeuroRadarChart />);
    expect(screen.getByText('Radar dos 3 Cérebros')).toBeInTheDocument();
  });

  it('accepts custom title prop', () => {
    render(<NeuroRadarChart title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('shows contact name', () => {
    render(<NeuroRadarChart contactName="João" />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('shows brain system labels', () => {
    render(<NeuroRadarChart />);
    expect(screen.getByText(/Reptiliano|Límbico|Neocórtex/)).toBeInTheDocument();
  });

  it('accepts discProfile prop', () => {
    const { container } = render(<NeuroRadarChart discProfile="D" />);
    expect(container).toBeTruthy();
  });

  it('accepts compact prop', () => {
    const { container } = render(<NeuroRadarChart compact={true} />);
    expect(container).toBeTruthy();
  });

  it('accepts showLegend prop', () => {
    const { container } = render(<NeuroRadarChart showLegend={false} />);
    expect(container).toBeTruthy();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroRadarChart className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts interactions prop', () => {
    const interactions = [{ content: 'Test interaction' }];
    const { container } = render(<NeuroRadarChart interactions={interactions} />);
    expect(container).toBeTruthy();
  });

  it('renders chart container', () => {
    const { container } = render(<NeuroRadarChart />);
    expect(container.querySelector('div')).toBeTruthy();
  });
});
