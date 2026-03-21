import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceInput } from '../VoiceInput';

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
  supabase: { functions: { invoke: vi.fn() } },
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('VoiceInput', () => {
  it('renders the voice input button', () => {
    render(<VoiceInput onTranscription={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<VoiceInput onTranscription={() => {}} />);
    expect(screen.getByText(/Clique para gravar/)).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<VoiceInput onTranscription={() => {}} placeholder="Record audio" />);
    expect(screen.getByText('Record audio')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<VoiceInput onTranscription={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VoiceInput onTranscription={() => {}} className="custom-voice" />
    );
    expect(container.firstChild).toHaveClass('custom-voice');
  });

  it('renders mic icon by default', () => {
    const { container } = render(<VoiceInput onTranscription={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not start recording when disabled', async () => {
    const user = userEvent.setup();
    const onTranscription = vi.fn();
    render(<VoiceInput onTranscription={onTranscription} disabled />);
    await user.click(screen.getByRole('button'));
    expect(onTranscription).not.toHaveBeenCalled();
  });
});
