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
vi.mock('@/lib/contact-utils', () => ({
  getDominantVAK: vi.fn(() => 'V'),
  getDISCProfile: vi.fn(() => 'D'),
  getContactBehavior: vi.fn(),
}));
vi.mock('@/types/vak', () => ({ VAKType: {} }));

import MiltonianCalibration from '../MiltonianCalibration';

describe('MiltonianCalibration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the title', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText('Calibração Miltoniana')).toBeInTheDocument();
  });

  it('shows presupposition category', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText(/Pressuposto|presupposition/i)).toBeInTheDocument();
  });

  it('shows first pattern name', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText('Pressuposto Temporal')).toBeInTheDocument();
  });

  it('renders pattern template', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText(/Quando você/)).toBeInTheDocument();
  });

  it('renders pattern example', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText(/começar a usar/)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<MiltonianCalibration className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('accepts context prop', () => {
    const { container } = render(<MiltonianCalibration context="venda direta" />);
    expect(container).toBeTruthy();
  });

  it('renders without contact using demo contact', () => {
    const { container } = render(<MiltonianCalibration />);
    expect(container).toBeTruthy();
  });

  it('shows copy buttons for patterns', () => {
    render(<MiltonianCalibration />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows when to use info', () => {
    render(<MiltonianCalibration />);
    expect(screen.getByText(/indeciso sobre começar/)).toBeInTheDocument();
  });
});
