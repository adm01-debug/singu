import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CelebrationProvider, useCelebration } from '../CelebrationProvider';

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

function TestConsumer() {
  const { celebrate } = useCelebration();
  return (
    <button onClick={() => celebrate({
      type: 'task-complete',
      title: 'Test Celebration',
      subtitle: 'Well done!',
      duration: 1000,
    })}>
      Celebrate
    </button>
  );
}

describe('CelebrationProvider', () => {
  it('renders children', () => {
    render(
      <CelebrationProvider>
        <div>Child content</div>
      </CelebrationProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('provides celebrate function', () => {
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );
    expect(screen.getByRole('button', { name: 'Celebrate' })).toBeInTheDocument();
  });

  it('shows celebration overlay when triggered', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));
    expect(screen.getByText('Test Celebration')).toBeInTheDocument();
  });

  it('shows subtitle in overlay', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <CelebrationProvider>
        <TestConsumer />
      </CelebrationProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));
    expect(screen.getByText('Well done!')).toBeInTheDocument();
  });
});

describe('useCelebration', () => {
  it('throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useCelebration must be used within CelebrationProvider');
    consoleError.mockRestore();
  });
});
