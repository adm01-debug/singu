import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      return ({ children, ...props }: any) => {
        const Element = typeof tag === 'string' ? tag : 'div';
        return <Element {...props}>{children}</Element>;
      };
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/hooks/useStakeholderAnalysis', () => ({
  useStakeholderAnalysis: () => ({
    stakeholders: [
      { id: '1', name: 'Alice', power: 80, interest: 60, category: 'manage_closely', influence: 'high' },
      { id: '2', name: 'Bob', power: 30, interest: 90, category: 'keep_informed', influence: 'medium' },
    ],
    loading: false,
    error: null,
    fetchStakeholders: vi.fn(),
  }),
}));

vi.mock('@/hooks/useStakeholderAlerts', () => ({
  useStakeholderAlerts: () => ({
    alerts: [],
    loading: false,
    fetchAlerts: vi.fn(),
    dismissAlert: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

import { StakeholderMap } from '../StakeholderMap';

describe('StakeholderMap', () => {
  it('renders the component', () => {
    const { container } = render(<StakeholderMap />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders stakeholder names', () => {
    render(<StakeholderMap />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<StakeholderMap />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('renders with className', () => {
    const { container } = render(<StakeholderMap className="custom" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('can switch tabs', async () => {
    const user = userEvent.setup();
    render(<StakeholderMap />);
    const tabs = screen.getAllByRole('tab');
    if (tabs.length > 1) {
      await user.click(tabs[1]);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    }
  });
});
