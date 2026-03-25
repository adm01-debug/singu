import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TourPreferencesPanel } from '../TourPreferencesPanel';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockResetTour = vi.fn();
const mockStartTour = vi.fn();

vi.mock('@/components/onboarding/OnboardingTour', () => ({
  useOnboardingTour: () => ({
    hasCompleted: true,
    resetTour: mockResetTour,
    startTour: mockStartTour,
    isOpen: false,
  }),
}));
vi.mock('@/lib/pushNotifications', () => ({
  isPushSupported: () => true,
  subscribeToPush: vi.fn().mockResolvedValue({}),
  unsubscribeFromPush: vi.fn().mockResolvedValue(true),
  getSubscriptionStatus: vi.fn().mockResolvedValue({ isSubscribed: false }),
}));

describe('TourPreferencesPanel', () => {
  it('renders tour section title', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Tour de Onboarding')).toBeInTheDocument();
  });

  it('renders tour description', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Gerencie o tour interativo que apresenta as funcionalidades do sistema')).toBeInTheDocument();
  });

  it('renders tour status', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Status do Tour')).toBeInTheDocument();
  });

  it('shows completed status badge', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('shows completed message', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Tour concluído ou pulado')).toBeInTheDocument();
  });

  it('renders Resetar Tour button', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Resetar Tour')).toBeInTheDocument();
  });

  it('renders Iniciar Tour Agora button', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Iniciar Tour Agora')).toBeInTheDocument();
  });

  it('calls resetTour when reset button is clicked', () => {
    render(<TourPreferencesPanel />);
    fireEvent.click(screen.getByText('Resetar Tour'));
    expect(mockResetTour).toHaveBeenCalled();
  });

  it('calls startTour when start button is clicked', () => {
    render(<TourPreferencesPanel />);
    fireEvent.click(screen.getByText('Iniciar Tour Agora'));
    expect(mockStartTour).toHaveBeenCalled();
  });

  it('renders push notifications section', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Push Notifications Nativas')).toBeInTheDocument();
  });

  it('renders push notifications description', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Receba notificações mesmo quando o app estiver fechado')).toBeInTheDocument();
  });

  it('renders push notification toggle', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
  });

  it('renders notification types list', () => {
    render(<TourPreferencesPanel />);
    expect(screen.getByText('Tipos de notificações push:')).toBeInTheDocument();
    expect(screen.getByText('Alertas de saúde de relacionamento')).toBeInTheDocument();
    expect(screen.getByText('Lembretes de follow-up')).toBeInTheDocument();
  });
});
