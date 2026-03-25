import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
      select: () => ({
        csv: vi.fn().mockResolvedValue({ data: '', error: null }),
        then: vi.fn(),
      }),
    }),
  },
}));

import { AdvancedDataExporter } from '../AdvancedDataExporter';

describe('AdvancedDataExporter', () => {
  it('renders the exporter trigger', () => {
    render(<AdvancedDataExporter entityType="contacts" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('opens dialog on click', async () => {
    const user = userEvent.setup();
    render(<AdvancedDataExporter entityType="contacts" />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText(/exportar/i)).toBeInTheDocument();
  });

  it('renders for contacts entity type', () => {
    const { container } = render(<AdvancedDataExporter entityType="contacts" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders for companies entity type', () => {
    const { container } = render(<AdvancedDataExporter entityType="companies" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders for interactions entity type', () => {
    const { container } = render(<AdvancedDataExporter entityType="interactions" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without errors', () => {
    expect(() => render(<AdvancedDataExporter entityType="contacts" />)).not.toThrow();
  });
});
