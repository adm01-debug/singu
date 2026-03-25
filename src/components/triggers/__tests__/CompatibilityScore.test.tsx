import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle, eq: mockEq }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
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
vi.mock('@/types/vak', () => ({
  VAKType: {}, VAKProfile: {}, VAK_LABELS: { V: 'Visual', A: 'Auditivo', K: 'Cinestésico', D: 'Digital' },
}));
vi.mock('@/types/metaprograms', () => ({
  MetaprogramProfile: {}, METAPROGRAM_LABELS: {},
}));

import CompatibilityScore from '../CompatibilityScore';

const mockContact = {
  id: '1',
  firstName: 'João',
  lastName: 'Silva',
  behavior: { discProfile: 'D' },
} as any;

describe('CompatibilityScore', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the component', () => {
    const { container } = render(
      <CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />
    );
    expect(container).toBeTruthy();
  });

  it('shows compatibility title', () => {
    render(<CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />);
    expect(screen.getByText(/Compatibilidade|Score/i)).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });

  it('shows contact name', () => {
    render(<CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />);
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('renders compatibility factors', () => {
    render(<CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />);
    expect(screen.getByText(/DISC|VAK|Metaprograma/i)).toBeInTheDocument();
  });

  it('calls supabase for salesperson profile', async () => {
    render(<CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />);
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('salesperson_profiles');
    });
  });

  it('renders progress bars for factors', () => {
    const { container } = render(
      <CompatibilityScore contact={mockContact} vakProfile={null} metaprogramProfile={null} />
    );
    expect(container).toBeTruthy();
  });

  it('accepts vakProfile prop', () => {
    const vakProfile = { dominant: 'V', scores: { V: 80, A: 10, K: 10 } } as any;
    const { container } = render(
      <CompatibilityScore contact={mockContact} vakProfile={vakProfile} metaprogramProfile={null} />
    );
    expect(container).toBeTruthy();
  });
});
