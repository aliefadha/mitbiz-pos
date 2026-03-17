import { forwardRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Format number with thousand separators (e.g., 1000000 -> 1.000.000)
function formatWithSeparator(value: string): string {
  if (!value) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  if (num === 0) return '0';
  return Math.trunc(num).toLocaleString('id-ID');
}

// Remove all non-numeric characters
function stripNonNumeric(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = '0', disabled, className }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      setDisplayValue(formatWithSeparator(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawValue = stripNonNumeric(inputValue);
      onChange(rawValue || '0');
      setDisplayValue(formatWithSeparator(rawValue));
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          Rp
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pl-10', className)}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
