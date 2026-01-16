import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Loader2, User, Briefcase, Building } from 'lucide-react';

type Entity = {
  type: 'lead' | 'opportunity' | 'company';
  id: string;
  name: string;
};

interface RelatedEntitySearchProps {
  value: Entity | null;
  onChange: (entity: Entity | null) => void;
}

export const RelatedEntitySearch = ({ value, onChange }: RelatedEntitySearchProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<{ leads: any[], opportunities: any[], companies: any[] }>({ leads: [], opportunities: [], companies: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSearchResults({ leads: [], opportunities: [], companies: [] });
      return;
    }

    const search = async () => {
      setIsLoading(true);
      const term = `%${debouncedSearchTerm}%`;

      const [leadsRes, oppsRes, compsRes] = await Promise.all([
        supabase.from('leads').select('id, nome').ilike('nome', term).limit(5),
        supabase.from('opportunities').select('id, titulo').ilike('titulo', term).limit(5),
        supabase.from('companies').select('id, nome').ilike('nome', term).limit(5),
      ]);

      setSearchResults({
        leads: leadsRes.data || [],
        opportunities: oppsRes.data || [],
        companies: compsRes.data || [],
      });
      setIsLoading(false);
    };

    search();
  }, [debouncedSearchTerm]);

  const handleSelect = (entity: Entity) => {
    onChange(entity);
    setOpen(false);
    setSearchTerm('');
  };

  const entityIcons = {
    lead: <User className="w-4 h-4 mr-2" />,
    opportunity: <Briefcase className="w-4 h-4 mr-2" />,
    company: <Building className="w-4 h-4 mr-2" />,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center">
              {entityIcons[value.type]}
              {value.name}
            </div>
          ) : (
            "Vincular a..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar lead, oportunidade ou empresa..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && <div className="p-2 flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            {!isLoading && debouncedSearchTerm.length > 1 && Object.values(searchResults).every(arr => arr.length === 0) && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            
            {searchResults.leads.length > 0 && (
              <CommandGroup heading="Leads">
                {searchResults.leads.map(lead => (
                  <CommandItem key={`lead-${lead.id}`} onSelect={() => handleSelect({ type: 'lead', id: lead.id, name: lead.nome })}>
                    <User className="w-4 h-4 mr-2" />
                    {lead.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults.opportunities.length > 0 && (
              <CommandGroup heading="Oportunidades">
                {searchResults.opportunities.map(opp => (
                  <CommandItem key={`opp-${opp.id}`} onSelect={() => handleSelect({ type: 'opportunity', id: opp.id, name: opp.titulo })}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    {opp.titulo}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults.companies.length > 0 && (
              <CommandGroup heading="Empresas">
                {searchResults.companies.map(comp => (
                  <CommandItem key={`comp-${comp.id}`} onSelect={() => handleSelect({ type: 'company', id: comp.id, name: comp.nome })}>
                    <Building className="w-4 h-4 mr-2" />
                    {comp.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};