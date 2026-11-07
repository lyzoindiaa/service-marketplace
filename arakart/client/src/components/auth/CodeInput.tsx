import React, { useRef } from 'react';

export interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  const handleInputChange = (idx: number, char: string) => {
    // Only accept numeric digit
    const cleaned = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = cleaned;
    const newValue = newDigits.join('');
    onChange(newValue);

    if (cleaned && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      inputsRef.current[focusIdx]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          id={idx === 0 ? 'auth-otp-input-0' : undefined}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx]}
          disabled={disabled}
          onChange={(e) => handleInputChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border bg-white focus:outline-none transition-colors shadow-xs ${
            hasError
              ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200'
              : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};
