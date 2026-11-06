import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeInput } from '../CodeInput';

describe('CodeInput Component (FE-004)', () => {
  it('renders 6 individual input boxes', () => {
    const handleChange = vi.fn();
    render(<CodeInput value="" onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(6);
  });

  it('entering digits calls onChange with concatenated value', () => {
    const handleChange = vi.fn();
    render(<CodeInput value="12" onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('');

    fireEvent.change(inputs[2], { target: { value: '3' } });
    expect(handleChange).toHaveBeenCalledWith('123');
  });

  it('handles paste of full 6-digit code', () => {
    const handleChange = vi.fn();
    render(<CodeInput value="" onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '852963' },
    });

    expect(handleChange).toHaveBeenCalledWith('852963');
  });
});
