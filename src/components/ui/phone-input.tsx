import React, { useState, useEffect, forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  value: string;
  label: string;
  code: string;
  flag: string;
  mask: (value: string) => string;
  normalize: (value: string) => string;
}

const countries: Country[] = [
  {
    value: 'br',
    label: 'Brasil',
    code: '+55',
    flag: '🇧🇷',
    mask: (value) => {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 10) {
        return digits
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    },
    normalize: (value) => '+55' + value.replace(/\D/g, ''),
  },
  {
    value: 'us',
    label: 'United States',
    code: '+1',
    flag: '🇺🇸',
    mask: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '($1) $2')
        .replace(/(\d{3})(\d)/, '$1-$2')
        .slice(0, 14);
    },
    normalize: (value) => '+1' + value.replace(/\D/g, ''),
  },
  {
    value: 'pt',
    label: 'Portugal',
    code: '+351',
    flag: '🇵🇹',
    mask: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1 $2')
        .replace(/(\d{3})(\d)/, '$1 $2')
        .slice(0, 11);
    },
    normalize: (value) => '+351' + value.replace(/\D/g, ''),
  },
  {
    value: 'ar',
    label: 'Argentina',
    code: '+54',
    flag: '🇦🇷',
    mask: (value) => {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 15);
    },
    normalize: (value) => '+54' + value.replace(/\D/g, ''),
  },
];

interface PhoneInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: string | null | undefined;
  onValueChange: (value: string | undefined) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
    const [open, setOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      const countryCode = value?.substring(0, selectedCountry.code.length);
      if (value && countryCode !== selectedCountry.code) {
        const foundCountry = countries.find(c => value.startsWith(c.code));
        if (foundCountry) {
          setSelectedCountry(foundCountry);
        }
      }
      const numberPart = value ? value.substring(selectedCountry.code.length) : '';
      setDisplayValue(selectedCountry.mask(numberPart));
    }, [value, selectedCountry]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = selectedCountry.mask(e.target.value);
      setDisplayValue(maskedValue);
      const normalizedValue = selectedCountry.normalize(maskedValue);
      onValueChange(normalizedValue);
    };

    return (
      <div className="relative flex items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between w-[90px] rounded-r-none border-r-0"
            >
              {selectedCountry.flag}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar país..." />
              <CommandList>
                <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      value={country.label}
                      onSelect={() => {
                        setSelectedCountry(country);
                        setOpen(false);
                        const normalizedValue = country.normalize(displayValue);
                        onValueChange(normalizedValue);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', selectedCountry.value === country.value ? 'opacity-100' : 'opacity-0')} />
                      {country.flag} {country.label} ({country.code})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          className="rounded-l-none"
          placeholder={selectedCountry.mask('123456789')}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';