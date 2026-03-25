import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickAddButton } from '../QuickAddButton';

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

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [],
    createContact: vi.fn().mockResolvedValue(true),
    fetchContacts: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: () => ({
    companies: [],
    createCompany: vi.fn().mockResolvedValue(true),
    fetchCompanies: vi.fn(),
  }),
}));

vi.mock('@/hooks/useInteractions', () => ({
  useInteractions: () => ({
    createInteraction: vi.fn().mockResolvedValue(true),
    fetchInteractions: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/components/forms/ContactForm', () => ({
  ContactForm: ({ onCancel }: any) => <div data-testid="contact-form"><button onClick={onCancel}>Cancel</button></div>,
}));

vi.mock('@/components/forms/CompanyForm', () => ({
  CompanyForm: ({ onCancel }: any) => <div data-testid="company-form"><button onClick={onCancel}>Cancel</button></div>,
}));

vi.mock('@/components/forms/InteractionForm', () => ({
  InteractionForm: ({ onCancel }: any) => <div data-testid="interaction-form"><button onClick={onCancel}>Cancel</button></div>,
}));

describe('QuickAddButton', () => {
  it('renders the FAB', () => {
    render(<QuickAddButton />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens menu on click', async () => {
    const user = userEvent.setup();
    render(<QuickAddButton />);
    const fab = screen.getAllByRole('button')[0];
    await user.click(fab);
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText(/Interação/)).toBeInTheDocument();
  });

  it('shows contact form when contact item clicked', async () => {
    const user = userEvent.setup();
    render(<QuickAddButton />);
    await user.click(screen.getAllByRole('button')[0]);
    await user.click(screen.getByText('Contato'));
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
  });

  it('shows company form when company item clicked', async () => {
    const user = userEvent.setup();
    render(<QuickAddButton />);
    await user.click(screen.getAllByRole('button')[0]);
    await user.click(screen.getByText('Empresa'));
    expect(screen.getByTestId('company-form')).toBeInTheDocument();
  });

  it('shows interaction form when interaction item clicked', async () => {
    const user = userEvent.setup();
    render(<QuickAddButton />);
    await user.click(screen.getAllByRole('button')[0]);
    await user.click(screen.getByText(/Interação/));
    expect(screen.getByTestId('interaction-form')).toBeInTheDocument();
  });

  it('has data-tour attribute on FAB', () => {
    render(<QuickAddButton />);
    const fab = document.querySelector('[data-tour="quick-add"]');
    expect(fab).toBeInTheDocument();
  });
});
