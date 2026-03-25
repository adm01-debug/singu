import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useSmartReminders', () => ({
  useSmartReminders: () => ({
    reminders: [
      {
        id: 'r1',
        type: 'follow_up',
        title: 'Follow up with Alice',
        description: 'Call Alice',
        priority: 'high',
        contactId: 'c1',
        contactName: 'Alice',
        dueDate: '2024-01-15',
      },
    ],
    summary: {
      total: 1,
      byType: { follow_up: 1, birthday: 0, decay: 0, milestone: 0 },
      byPriority: { high: 1, medium: 0, low: 0 },
    },
    aiInsights: 'Some AI insights',
    isLoading: false,
    fetchReminders: vi.fn(),
    dismissReminder: vi.fn(),
    snoozeReminder: vi.fn(),
    completeReminder: vi.fn(),
  }),
}));

vi.mock('@/components/celebrations/CelebrationProvider', () => ({
  useCelebration: () => ({ celebrate: vi.fn() }),
}));

import { SmartRemindersPanel } from '../SmartRemindersPanel';

describe('SmartRemindersPanel', () => {
  it('renders the panel', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText('Smart Reminders')).toBeInTheDocument();
  });

  it('renders reminder title', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText('Follow up with Alice')).toBeInTheDocument();
  });

  it('renders compact version', () => {
    render(<SmartRemindersPanel compact />);
    expect(screen.getByText(/Lembretes/)).toBeInTheDocument();
  });

  it('shows AI insights section', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText(/Insights da IA/)).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
  });

  it('renders summary stats', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText('Follow-ups')).toBeInTheDocument();
  });

  it('shows high priority warning', () => {
    render(<SmartRemindersPanel />);
    expect(screen.getByText(/urgente/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SmartRemindersPanel className="custom" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
