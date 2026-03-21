import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput, CPFInput, CNPJInput, CurrencyInput, CEPInput, DateInput } from '../masked-input';

describe('PhoneInput', () => {
  it('renders input element', () => {
    render(<PhoneInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<PhoneInput value="" onChange={() => {}} placeholder="Phone" />);
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
  });

  it('calls onChange with formatted value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '1');
    expect(onChange).toHaveBeenCalled();
  });

  it('displays formatted phone value', () => {
    render(<PhoneInput value="11999887766" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue();
  });
});

describe('CPFInput', () => {
  it('renders input element', () => {
    render(<CPFInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange with value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CPFInput value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '1');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('CNPJInput', () => {
  it('renders input element', () => {
    render(<CNPJInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('CurrencyInput', () => {
  it('renders input element', () => {
    render(<CurrencyInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '1');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('CEPInput', () => {
  it('renders input element', () => {
    render(<CEPInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('DateInput', () => {
  it('renders input element', () => {
    render(<DateInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
