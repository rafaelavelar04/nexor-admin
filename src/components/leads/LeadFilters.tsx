import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { MultiSelectCreatable, Selectable } from "../ui/multi-select-creatable";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Checkbox } from "../ui/checkbox";

export interface LeadFilters {
  nome?: string;
  empresa?: string;
  status?: string[];
  nicho?: string[];
  responsavel_id?: string[];
  tags?: string[];
  cidade?: string;
  canal?: string;
  created_at?: DateRange;
  proximo_followup?: DateRange;
  sem_followup?: boolean;
  followup_atrasado?: boolean;
  meus_leads?: boolean;
  sem_responsavel?: boolean;
  convertidos?: boolean;
  nao_convertidos?: boolean;
}

interface LeadFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LeadFilters;
  setFilters: (filters: LeadFilters) => void;
  users: { id: string; full_name: string }[];
  allTags: Selectable[];
  nichoOptions: Selectable[];
}

const statusOptions = ["Não contatado", "Primeiro contato feito", "Sem resposta", "Em conversa", "Follow-up agendado", "Não interessado", "Convertido"];

export const LeadFilters = ({ isOpen, onClose, filters, setFilters, users, allTags, nichoOptions }: LeadFiltersProps) => {
  const handleFilterChange = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleMultiSelectChange = (key: 'status' | 'nicho' | 'responsavel_id' | 'tags', selected: Selectable[]) => {
    handleFilterChange(key, selected.map(s => s.value));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtros Avançados de Leads</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-1 pr-4 space-y-4">
          {/* Nome e Empresa foram removidos daqui para a busca global */}
          <div><Label>Status</Label><MultiSelectCreatable options={statusOptions.map(s => ({ value: s, label: s, nome: s }))} selected={filters.status?.map(s => ({ value: s, label: s, nome: s })) || []} onChange={selected => handleMultiSelectChange('status', selected)} placeholder="Selecione os status..." /></div>
          <div><Label>Nicho</Label><MultiSelectCreatable options={nichoOptions} selected={filters.nicho?.map(n => ({ value: n, label: n, nome: n })) || []} onChange={selected => handleMultiSelectChange('nicho', selected)} placeholder="Selecione os nichos..." /></div>
          <div><Label>Responsável</Label><MultiSelectCreatable options={users.map(u => ({ value: u.id, label: u.full_name, nome: u.full_name }))} selected={filters.responsavel_id?.map(id => ({ value: id, label: users.find(u => u.id === id)?.full_name || id, nome: users.find(u => u.id === id)?.full_name || id })) || []} onChange={selected => handleMultiSelectChange('responsavel_id', selected)} placeholder="Selecione os responsáveis..." /></div>
          <div><Label>Tags</Label><MultiSelectCreatable options={allTags} selected={filters.tags?.map(id => allTags.find(t => t.value === id) || { value: id, label: id, nome: id }) || []} onChange={selected => handleMultiSelectChange('tags', selected)} placeholder="Selecione as tags..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Cidade</Label><Input value={filters.cidade || ''} onChange={e => handleFilterChange('cidade', e.target.value)} /></div>
            <div><Label>Canal</Label><Input value={filters.canal || ''} onChange={e => handleFilterChange('canal', e.target.value)} /></div>
          </div>
          <div>
            <Label>Data de Criação</Label>
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.created_at && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.created_at?.from ? (filters.created_at.to ? `${format(filters.created_at.from, "dd/MM/yy")} - ${format(filters.created_at.to, "dd/MM/yy")}` : format(filters.created_at.from, "dd/MM/yyyy")) : <span>Selecione um período</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={filters.created_at} onSelect={value => handleFilterChange('created_at', value)} /></PopoverContent></Popover>
          </div>
          <div>
            <Label>Próximo Follow-up</Label>
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filters.proximo_followup && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filters.proximo_followup?.from ? (filters.proximo_followup.to ? `${format(filters.proximo_followup.from, "dd/MM/yy")} - ${format(filters.proximo_followup.to, "dd/MM/yy")}` : format(filters.proximo_followup.from, "dd/MM/yyyy")) : <span>Selecione um período</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={filters.proximo_followup} onSelect={value => handleFilterChange('proximo_followup', value)} /></PopoverContent></Popover>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center space-x-2"><Checkbox id="meus_leads" checked={filters.meus_leads} onCheckedChange={checked => handleFilterChange('meus_leads', !!checked)} /><Label htmlFor="meus_leads">Apenas meus leads</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="sem_responsavel" checked={filters.sem_responsavel} onCheckedChange={checked => handleFilterChange('sem_responsavel', !!checked)} /><Label htmlFor="sem_responsavel">Sem responsável</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="sem_followup" checked={filters.sem_followup} onCheckedChange={checked => handleFilterChange('sem_followup', !!checked)} /><Label htmlFor="sem_followup">Sem follow-up</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="followup_atrasado" checked={filters.followup_atrasado} onCheckedChange={checked => handleFilterChange('followup_atrasado', !!checked)} /><Label htmlFor="followup_atrasado">Follow-up atrasado</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="convertidos" checked={filters.convertidos} onCheckedChange={checked => handleFilterChange('convertidos', !!checked)} /><Label htmlFor="convertidos">Convertidos</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="nao_convertidos" checked={filters.nao_convertidos} onCheckedChange={checked => handleFilterChange('nao_convertidos', !!checked)} /><Label htmlFor="nao_convertidos">Não convertidos</Label></div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={clearFilters}>Limpar Filtros</Button>
          <Button onClick={onClose}>Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};