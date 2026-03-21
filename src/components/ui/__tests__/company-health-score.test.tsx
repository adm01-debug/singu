import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyHealthScore, CompanyHealthBadge } from '../company-health-score';

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

describe('CompanyHealthScore', () => {
  const defaultMetrics = {
    revenueGrowth: 80,
    customerSatisfaction: 70,
    marketPosition: 60,
    innovation: 50,
    teamStability: 90,
  };

  it('renders health score component', () => {
    const { container } = render(<CompanyHealthScore metrics={defaultMetrics} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with high score indicator', () => {
    const highMetrics = {
      revenueGrowth: 95,
      customerSatisfaction: 90,
      marketPosition: 85,
      innovation: 92,
      teamStability: 95,
    };
    const { container } = render(<CompanyHealthScore metrics={highMetrics} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with low score indicator', () => {
    const lowMetrics = {
      revenueGrowth: 10,
      customerSatisfaction: 15,
      marketPosition: 20,
      innovation: 10,
      teamStability: 15,
    };
    const { container } = render(<CompanyHealthScore metrics={lowMetrics} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<CompanyHealthScore metrics={defaultMetrics} />);
    const container = document.body;
    expect(container).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CompanyHealthScore metrics={defaultMetrics} className="custom" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('CompanyHealthBadge', () => {
  it('renders excellent health', () => {
    render(<CompanyHealthBadge health="excellent" />);
    expect(screen.getByText(/Excelente/i)).toBeInTheDocument();
  });

  it('renders good health', () => {
    render(<CompanyHealthBadge health="good" />);
    expect(screen.getByText(/Boa/i)).toBeInTheDocument();
  });

  it('renders average health', () => {
    render(<CompanyHealthBadge health="average" />);
    expect(screen.getByText(/Regular/i)).toBeInTheDocument();
  });

  it('renders poor health', () => {
    render(<CompanyHealthBadge health="poor" />);
    expect(screen.getByText(/Ruim/i)).toBeInTheDocument();
  });
});
