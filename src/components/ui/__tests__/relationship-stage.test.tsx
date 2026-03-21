import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelationshipStageBadge, RelationshipFunnel } from '../relationship-stage';

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

vi.mock('@/types', () => ({
  RELATIONSHIP_STAGE_LABELS: {
    prospect: 'Prospecto',
    lead: 'Lead',
    opportunity: 'Oportunidade',
    customer: 'Cliente',
    partner: 'Parceiro',
    churned: 'Perdido',
    unknown: 'Desconhecido',
  },
}));

describe('RelationshipStageBadge', () => {
  it('renders prospect stage', () => {
    render(<RelationshipStageBadge stage="prospect" />);
    expect(screen.getByText('Prospecto')).toBeInTheDocument();
  });

  it('renders lead stage', () => {
    render(<RelationshipStageBadge stage="lead" />);
    expect(screen.getByText('Lead')).toBeInTheDocument();
  });

  it('renders customer stage', () => {
    render(<RelationshipStageBadge stage="customer" />);
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('renders partner stage', () => {
    render(<RelationshipStageBadge stage="partner" />);
    expect(screen.getByText('Parceiro')).toBeInTheDocument();
  });

  it('renders churned stage', () => {
    render(<RelationshipStageBadge stage="churned" />);
    expect(screen.getByText('Perdido')).toBeInTheDocument();
  });

  it('renders unknown stage', () => {
    render(<RelationshipStageBadge stage="unknown" />);
    expect(screen.getByText('Desconhecido')).toBeInTheDocument();
  });
});

describe('RelationshipFunnel', () => {
  it('renders funnel with stage counts', () => {
    const stages = {
      prospect: 10,
      lead: 8,
      opportunity: 5,
      customer: 3,
      partner: 1,
    };
    const { container } = render(<RelationshipFunnel stages={stages} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays count values', () => {
    const stages = {
      prospect: 15,
      lead: 10,
      opportunity: 7,
      customer: 4,
      partner: 2,
    };
    render(<RelationshipFunnel stages={stages} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
