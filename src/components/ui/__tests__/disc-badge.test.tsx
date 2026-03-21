import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DISCBadge, DISCSelector, DISCChart } from '../disc-badge';

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
  DISC_LABELS: {
    D: 'Dominância',
    I: 'Influência',
    S: 'Estabilidade',
    C: 'Conformidade',
  },
}));

describe('DISCBadge', () => {
  it('renders D profile badge', () => {
    render(<DISCBadge profile="D" />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders I profile badge', () => {
    render(<DISCBadge profile="I" />);
    expect(screen.getByText('I')).toBeInTheDocument();
  });

  it('renders S profile badge', () => {
    render(<DISCBadge profile="S" />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('renders C profile badge', () => {
    render(<DISCBadge profile="C" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders with label when showLabel is true', () => {
    render(<DISCBadge profile="D" showLabel />);
    expect(screen.getByText(/Dominância/)).toBeInTheDocument();
  });

  it('does not render label when showLabel is false', () => {
    render(<DISCBadge profile="D" showLabel={false} />);
    expect(screen.queryByText(/Dominância/)).not.toBeInTheDocument();
  });

  it('renders with confidence', () => {
    render(<DISCBadge profile="I" confidence={85} />);
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('applies size sm', () => {
    const { container } = render(<DISCBadge profile="D" size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('DISCSelector', () => {
  it('renders all four profile options', () => {
    render(<DISCSelector value="D" onChange={() => {}} />);
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('calls onChange when selecting profile', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DISCSelector value="D" onChange={onChange} />);
    await user.click(screen.getByText('I'));
    expect(onChange).toHaveBeenCalledWith('I');
  });
});

describe('DISCChart', () => {
  it('renders chart with scores', () => {
    const { container } = render(
      <DISCChart scores={{ D: 80, I: 60, S: 40, C: 70 }} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays all profile labels', () => {
    render(<DISCChart scores={{ D: 80, I: 60, S: 40, C: 70 }} />);
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
