import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InlineEdit } from '../InlineEdit';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('InlineEdit', () => {
  const mockOnSave = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders display value', () => {
    render(<InlineEdit value="Hello World" onSave={mockOnSave} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders empty text when value is empty', () => {
    render(<InlineEdit value="" onSave={mockOnSave} emptyText="Clique para adicionar" />);
    expect(screen.getByText('Clique para adicionar')).toBeInTheDocument();
  });

  it('enters edit mode on click', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Hello'));
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
  });

  it('shows save and cancel buttons in edit mode', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Hello'));
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('cancels edit on Escape key', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Hello'));
    const input = screen.getByDisplayValue('Hello');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('saves on Enter key for single-line input', async () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Hello'));
    const input = screen.getByDisplayValue('Hello');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('Updated');
    });
  });

  it('does not enter edit mode when disabled', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} disabled />);
    fireEvent.click(screen.getByText('Hello'));
    expect(screen.queryByDisplayValue('Hello')).not.toBeInTheDocument();
  });

  it('shows character count when maxLength is set', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} maxLength={100} />);
    fireEvent.click(screen.getByText('Hello'));
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('shows validation error', async () => {
    const validate = (v: string) => v.length < 3 ? 'Too short' : null;
    render(<InlineEdit value="Hello" onSave={mockOnSave} validate={validate} />);
    fireEvent.click(screen.getByText('Hello'));
    const input = screen.getByDisplayValue('Hello');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Too short')).toBeInTheDocument();
    });
  });

  it('does not save when value has not changed', async () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Hello'));
    fireEvent.keyDown(screen.getByDisplayValue('Hello'), { key: 'Enter' });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error when save fails', async () => {
    const failSave = vi.fn().mockResolvedValue(false);
    render(<InlineEdit value="Hello" onSave={failSave} />);
    fireEvent.click(screen.getByText('Hello'));
    const input = screen.getByDisplayValue('Hello');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument();
    });
  });

  it('hides edit icon when showEditIcon is false', () => {
    const { container } = render(<InlineEdit value="Hello" onSave={mockOnSave} showEditIcon={false} />);
    expect(container.querySelector('.lucide-pencil')).not.toBeInTheDocument();
  });

  it('renders textarea for multiline mode', () => {
    render(<InlineEdit value="Hello" onSave={mockOnSave} multiline />);
    fireEvent.click(screen.getByText('Hello'));
    expect(screen.getByDisplayValue('Hello').tagName).toBe('TEXTAREA');
  });
});
