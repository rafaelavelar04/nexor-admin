import * as React from 'react';
import { X, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface Selectable {
  id?: string;
  nome: string;
  cor?: string | null;
}

interface MultiSelectCreatableProps {
  options: Selectable[];
  selected: Selectable[];
  onChange: React.Dispatch<React.SetStateAction<Selectable[]>>;
  placeholder?: string;
  className?: string;
}

export function MultiSelectCreatable({
  options,
  selected,
  onChange,
  placeholder = 'Selecione ou crie...',
  className,
}: MultiSelectCreatableProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (item: Selectable) => {
    onChange([...selected, item]);
    setInputValue('');
  };

  const handleCreate = (nome: string) => {
    const newOption: Selectable = { nome: nome.trim() };
    onChange([...selected, newOption]);
    setInputValue('');
  };

  const handleUnselect = (itemToRemove: Selectable) => {
    onChange(selected.filter((item) => item.nome !== itemToRemove.nome));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const exists = options.some((opt) => opt.nome.toLowerCase() === inputValue.trim().toLowerCase()) || selected.some((sel) => sel.nome.toLowerCase() === inputValue.trim().toLowerCase());
      if (!exists) {
        handleCreate(inputValue);
      }
    }
  };

  const filteredOptions = options.filter(
    (option) => !selected.some((s) => s.nome === option.nome)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("group flex w-full flex-wrap items-center rounded-md border border-input bg-gray-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-10", className)}>
          {selected.length > 0 ? (
            selected.map((item) => (
              <Badge
                key={item.nome}
                variant="secondary"
                className="m-0.5 bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
              >
                {item.nome}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUnselect(item);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command onKeyDown={handleKeyDown}>
          <CommandInput
            placeholder="Buscar ou criar tag..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? `Pressione Enter para criar "${inputValue.trim()}"` : 'Nenhuma tag encontrada.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => handleSelect(option)}
                  className="flex items-center justify-between"
                >
                  {option.nome}
                  <Check className={cn('h-4 w-4', selected.some(s => s.nome === option.nome) ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}