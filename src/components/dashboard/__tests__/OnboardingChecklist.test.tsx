import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user' } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() })) }
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}));
vi.mock('@/components/ui/typography', () => ({
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/surface', () => ({
  Surface: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

import { OnboardingChecklist } from '../OnboardingChecklist';

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders without crashing when not all complete', () => {
    render(
      <OnboardingChecklist
        hasProfile={true}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    expect(screen.getByText('Complete seu perfil')).toBeInTheDocument();
  });

  it('returns null when all steps are complete', () => {
    const { container } = render(
      <OnboardingChecklist
        hasProfile={true}
        hasContacts={true}
        hasCompanies={true}
        hasInteractions={true}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when dismissed', () => {
    localStorage.setItem('singu_onboarding_dismissed', 'true');
    const { container } = render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows all checklist steps', () => {
    render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    expect(screen.getByText('Complete seu perfil')).toBeInTheDocument();
    expect(screen.getByText('Adicione uma empresa')).toBeInTheDocument();
    expect(screen.getByText('Adicione um contato')).toBeInTheDocument();
    expect(screen.getByText('Registre uma interação')).toBeInTheDocument();
  });

  it('shows step descriptions', () => {
    render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    expect(screen.getByText('Adicione seu nome e empresa')).toBeInTheDocument();
  });

  it('marks completed steps', () => {
    render(
      <OnboardingChecklist
        hasProfile={true}
        hasContacts={true}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    // 2 out of 4 are complete, so checklist still shows
    expect(screen.getByText('Adicione uma empresa')).toBeInTheDocument();
  });

  it('renders progress indicator', () => {
    const { container } = render(
      <OnboardingChecklist
        hasProfile={true}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    // Progress bar should be present
    expect(container.querySelector('[role="progressbar"], [class*="progress"], [class*="Progress"]')).toBeTruthy();
  });

  it('renders links for steps', () => {
    render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    const links = document.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('has dismiss button', () => {
    render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('does not crash on re-render', () => {
    const { rerender } = render(
      <OnboardingChecklist
        hasProfile={false}
        hasContacts={false}
        hasCompanies={false}
        hasInteractions={false}
      />
    );
    expect(() =>
      rerender(
        <OnboardingChecklist
          hasProfile={true}
          hasContacts={false}
          hasCompanies={false}
          hasInteractions={false}
        />
      )
    ).not.toThrow();
  });
});
