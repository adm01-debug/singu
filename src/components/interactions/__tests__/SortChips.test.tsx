import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortChips } from '../SortChips';

vi.mock('sonner', () => ({
  toast: { message: vi.fn() },
}));

describe('SortChips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza os 4 chips', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Mais recentes')).toBeInTheDocument();
    expect(screen.getByLabelText('Mais antigas')).toBeInTheDocument();
    expect(screen.getByLabelText('Melhor correspondência')).toBeInTheDocument();
    expect(screen.getByLabelText('Por pessoa/empresa')).toBeInTheDocument();
  });

  it('chip ativo recebe aria-pressed=true', () => {
    render(<SortChips value="oldest" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Mais antigas')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Mais recentes')).toHaveAttribute('aria-pressed', 'false');
  });

  it('click em chip inativo chama onChange', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.click(screen.getByLabelText('Mais antigas'));
    expect(onChange).toHaveBeenCalledWith('oldest');
  });

  it('Melhor correspondência fica disabled sem query', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={false} />);
    expect(screen.getByLabelText('Melhor correspondência')).toBeDisabled();
  });

  it('Melhor correspondência fica habilitada com query', () => {
    render(<SortChips value="recent" onChange={() => {}} hasQuery={true} />);
    expect(screen.getByLabelText('Melhor correspondência')).not.toBeDisabled();
  });

  it('Alt+R chama onChange("recent")', () => {
    const onChange = vi.fn();
    render(<SortChips value="oldest" onChange={onChange} hasQuery={false} />);
    fireEvent.keyDown(window, { key: 'r', altKey: true });
    expect(onChange).toHaveBeenCalledWith('recent');
  });

  it('Alt+M é ignorado quando hasQuery=false', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Alt+M funciona quando hasQuery=true', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={true} />);
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    expect(onChange).toHaveBeenCalledWith('relevance');
  });

  it('clicar no chip ativo é no-op', () => {
    const onChange = vi.fn();
    render(<SortChips value="recent" onChange={onChange} hasQuery={false} />);
    fireEvent.click(screen.getByLabelText('Mais recentes'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
