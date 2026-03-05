import { useEffect, useState } from 'react';
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
  if (!value || value === '0') return '';
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

// Remove all non-numeric characters
function stripNonNumeric(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled,
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Update display value when external value changes
  useEffect(() => {
    setDisplayValue(formatWithSeparator(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Strip non-numeric characters
    const rawValue = stripNonNumeric(inputValue);

    // Update the actual form value (raw number)
    onChange(rawValue || '0');

    // Update display with formatting
    setDisplayValue(formatWithSeparator(rawValue));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
        Rp
      </span>
      <Input
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
