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

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', user_metadata: { first_name: 'Test', last_name: 'User' } },
  }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('./steps/WelcomeStep', () => ({
  default: ({ onNext }: any) => <div data-testid="welcome-step"><button onClick={onNext}>Next</button></div>,
}));
vi.mock('./steps/ProfileStep', () => ({
  default: ({ onNext, onBack }: any) => <div data-testid="profile-step"><button onClick={onNext}>Next</button><button onClick={onBack}>Back</button></div>,
}));
vi.mock('./steps/ImportStep', () => ({
  default: ({ onNext, onBack }: any) => <div data-testid="import-step"><button onClick={onNext}>Next</button></div>,
}));
vi.mock('./steps/PreferencesStep', () => ({
  default: ({ onNext, onBack }: any) => <div data-testid="prefs-step"><button onClick={onNext}>Next</button></div>,
}));
vi.mock('./steps/CompletionStep', () => ({
  default: ({ onComplete }: any) => <div data-testid="complete-step"><button onClick={onComplete}>Complete</button></div>,
}));

import OnboardingWizard from '../OnboardingWizard';

describe('OnboardingWizard', () => {
  it('renders the wizard', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText('SINGU')).toBeInTheDocument();
  });

  it('renders the first step', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText(/Progresso|Passo/i)).toBeInTheDocument();
  });

  it('renders step titles', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('profile-step')).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<OnboardingWizard onComplete={() => {}} />)).not.toThrow();
  });
});
