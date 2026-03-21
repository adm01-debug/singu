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
vi.mock('@/types/neuromarketing', () => ({
  BrainSystem: {}, Neurochemical: {},
}));
vi.mock('@/data/neuromarketingData', () => ({
  NEUROCHEMICAL_INFO: {
    dopamine: { name: 'Dopamina', color: '#ff0' },
    cortisol: { name: 'Cortisol', color: '#f00' },
    serotonin: { name: 'Serotonina', color: '#0f0' },
    oxytocin: { name: 'Ocitocina', color: '#f0f' },
    endorphin: { name: 'Endorfina', color: '#0ff' },
    adrenaline: { name: 'Adrenalina', color: '#f80' },
  },
}));

import NeuroHeatmapCalendar from '../NeuroHeatmapCalendar';

describe('NeuroHeatmapCalendar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText('Neuro Heatmap')).toBeInTheDocument();
  });

  it('shows day labels', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Ter')).toBeInTheDocument();
    expect(screen.getByText('Qua')).toBeInTheDocument();
  });

  it('shows time block labels', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText('Manhã')).toBeInTheDocument();
    expect(screen.getByText('Tarde')).toBeInTheDocument();
  });

  it('shows time ranges', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText('8h-12h')).toBeInTheDocument();
  });

  it('accepts contactName prop', () => {
    render(<NeuroHeatmapCalendar contactName="João" />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<NeuroHeatmapCalendar className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('renders 7-day grid', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
  });

  it('shows neurochemical pattern info', () => {
    render(<NeuroHeatmapCalendar />);
    expect(screen.getByText(/Cortisol|Dopamina|Serotonina/)).toBeInTheDocument();
  });

  it('accepts dominantBrain prop', () => {
    const { container } = render(<NeuroHeatmapCalendar dominantBrain="reptilian" />);
    expect(container).toBeTruthy();
  });

  it('accepts timeData prop', () => {
    const { container } = render(<NeuroHeatmapCalendar timeData={[]} />);
    expect(container).toBeTruthy();
  });
});
