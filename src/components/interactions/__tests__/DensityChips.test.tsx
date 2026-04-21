import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DensityChips } from '@/components/interactions/DensityChips';

describe('DensityChips', () => {
  it('renderiza dois botões com aria-pressed correto', () => {
    render(<DensityChips value="comfortable" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confortável' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('click no botão inativo dispara onChange', () => {
    const onChange = vi.fn();
    render(<DensityChips value="comfortable" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    expect(onChange).toHaveBeenCalledWith('compact');
  });

  it('click no botão ativo é no-op', () => {
    const onChange = vi.fn();
    render(<DensityChips value="compact" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
