import React, { useState, useEffect, forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value' | 'type'> {
  value: number | null | undefined;
  onValueChange: (value: number | undefined) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    const format = (num: number | undefined | null) => {
      if (num === undefined || num === null) return '';
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    useEffect(() => {
      const digits = displayValue.replace(/\D/g, '');
      const numberValue = parseInt(digits, 10) / 100;
      if (value !== numberValue) {
        setDisplayValue(format(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = inputValue.replace(/\D/g, '');

      if (digits === '') {
        setDisplayValue('');
        onValueChange(undefined);
        return;
      }

      const numberValue = parseInt(digits, 10) / 100;
      onValueChange(numberValue);
      setDisplayValue(format(numberValue));
    };

    return (
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="0,00"
          className="pl-10"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';