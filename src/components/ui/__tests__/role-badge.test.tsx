import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from '../role-badge';

vi.mock('@/types', () => ({}));

describe('RoleBadge', () => {
  it('renders contact role', () => {
    render(<RoleBadge role="contact" />);
    expect(screen.getByText(/Contato/i)).toBeInTheDocument();
  });

  it('renders owner role', () => {
    render(<RoleBadge role="owner" />);
    expect(screen.getByText(/Proprietário|Owner/i)).toBeInTheDocument();
  });

  it('renders manager role', () => {
    render(<RoleBadge role="manager" />);
    expect(screen.getByText(/Gerente|Manager/i)).toBeInTheDocument();
  });

  it('renders buyer role', () => {
    render(<RoleBadge role="buyer" />);
    expect(screen.getByText(/Comprador|Buyer/i)).toBeInTheDocument();
  });

  it('renders decision_maker role', () => {
    render(<RoleBadge role="decision_maker" />);
    expect(screen.getByText(/Decisor|Decision/i)).toBeInTheDocument();
  });

  it('renders influencer role', () => {
    render(<RoleBadge role="influencer" />);
    expect(screen.getByText(/Influenciador|Influencer/i)).toBeInTheDocument();
  });

  it('renders as badge element', () => {
    const { container } = render(<RoleBadge role="contact" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
