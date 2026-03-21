import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickActionsMenu } from '../QuickActionsMenu';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('QuickActionsMenu', () => {
  const defaultProps = {
    entityType: 'contact' as const,
    entityId: 'contact-1',
    entityName: 'João Silva',
    children: <div data-testid="trigger">Right click me</div>,
  };

  it('renders children (trigger element)', () => {
    render(<QuickActionsMenu {...defaultProps} />);
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('renders trigger text', () => {
    render(<QuickActionsMenu {...defaultProps} />);
    expect(screen.getByText('Right click me')).toBeInTheDocument();
  });

  it('renders with contact entity type', () => {
    render(<QuickActionsMenu {...defaultProps} />);
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('renders with company entity type', () => {
    render(
      <QuickActionsMenu {...defaultProps} entityType="company">
        <div data-testid="company-trigger">Company</div>
      </QuickActionsMenu>
    );
    expect(screen.getByTestId('company-trigger')).toBeInTheDocument();
  });

  it('renders with email prop', () => {
    render(
      <QuickActionsMenu {...defaultProps} email="joao@test.com">
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with phone prop', () => {
    render(
      <QuickActionsMenu {...defaultProps} phone="11999999999">
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with all contact methods', () => {
    render(
      <QuickActionsMenu
        {...defaultProps}
        email="test@test.com"
        phone="11999999999"
        whatsapp="11999999999"
        linkedin="linkedin.com/in/joao"
      >
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with favorite state', () => {
    render(
      <QuickActionsMenu {...defaultProps} isFavorite onToggleFavorite={vi.fn()}>
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with onEdit handler', () => {
    render(
      <QuickActionsMenu {...defaultProps} onEdit={vi.fn()}>
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with onDelete handler', () => {
    render(
      <QuickActionsMenu {...defaultProps} onDelete={vi.fn()}>
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with onNewInteraction for contacts', () => {
    render(
      <QuickActionsMenu {...defaultProps} onNewInteraction={vi.fn()}>
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders with onAddTag handler', () => {
    render(
      <QuickActionsMenu {...defaultProps} onAddTag={vi.fn()}>
        <div>Trigger</div>
      </QuickActionsMenu>
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });
});
