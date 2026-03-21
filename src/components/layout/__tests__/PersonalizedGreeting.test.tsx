import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PersonalizedGreeting } from '../PersonalizedGreeting';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user', email: 'test@test.com', user_metadata: { first_name: 'Carlos' } } }), AuthProvider: ({ children }: any) => children }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@/lib/ux-messages', () => ({
  getGreeting: (name?: string) => name ? `Olá, ${name}!` : 'Olá!',
}));

describe('PersonalizedGreeting', () => {
  it('renders greeting with user name', () => {
    render(<PersonalizedGreeting />);
    expect(screen.getByText('Olá, Carlos!')).toBeInTheDocument();
  });

  it('renders with default md size', () => {
    const { container } = render(<PersonalizedGreeting />);
    expect(container.querySelector('.text-lg')).toBeInTheDocument();
  });

  it('renders with sm size', () => {
    const { container } = render(<PersonalizedGreeting size="sm" />);
    expect(container.querySelector('.text-sm')).toBeInTheDocument();
  });

  it('renders with lg size', () => {
    const { container } = render(<PersonalizedGreeting size="lg" />);
    expect(container.querySelector('.text-2xl')).toBeInTheDocument();
  });

  it('renders icon by default', () => {
    const { container } = render(<PersonalizedGreeting />);
    // Icon should be present (svg element)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<PersonalizedGreeting showIcon={false} />);
    // Should only have the text, no icon-related wrapper
    const iconWrappers = container.querySelectorAll('svg');
    // When showIcon=false and size != lg, there should be 0 time-of-day SVGs
    // (lg adds Sparkles)
    expect(iconWrappers.length).toBe(0);
  });

  it('applies custom className', () => {
    const { container } = render(<PersonalizedGreeting className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders greeting text within a span', () => {
    render(<PersonalizedGreeting />);
    const greetingSpan = screen.getByText('Olá, Carlos!');
    expect(greetingSpan.tagName).toBe('SPAN');
  });
});
