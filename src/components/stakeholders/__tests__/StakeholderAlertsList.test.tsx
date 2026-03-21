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

const mockDismissAlert = vi.fn();
vi.mock('@/hooks/useStakeholderAlerts', () => ({
  useStakeholderAlerts: () => ({
    alerts: [
      { id: 'a1', title: 'Alert 1', severity: 'high', message: 'High severity alert', contactId: 'c1', contactName: 'John' },
      { id: 'a2', title: 'Alert 2', severity: 'low', message: 'Low severity alert', contactId: 'c2', contactName: 'Jane' },
    ],
    loading: false,
    dismissAlert: mockDismissAlert,
    fetchAlerts: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { StakeholderAlertsList } from '../StakeholderAlertsList';

describe('StakeholderAlertsList', () => {
  it('renders alerts', () => {
    render(<StakeholderAlertsList />);
    expect(screen.getByText('Alert 1')).toBeInTheDocument();
    expect(screen.getByText('Alert 2')).toBeInTheDocument();
  });

  it('shows severity styling', () => {
    render(<StakeholderAlertsList />);
    expect(screen.getByText(/High severity alert/i)).toBeInTheDocument();
  });

  it('renders dismiss buttons', () => {
    render(<StakeholderAlertsList />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders contact names', () => {
    render(<StakeholderAlertsList />);
    expect(screen.getByText(/John/)).toBeInTheDocument();
    expect(screen.getByText(/Jane/)).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<StakeholderAlertsList />)).not.toThrow();
  });
});
