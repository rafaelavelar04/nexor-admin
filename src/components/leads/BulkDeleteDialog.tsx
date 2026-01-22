import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { NICHOS } from '@/lib/constants';
import { useDebounce } from '@/hooks/use-debounce';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (criteria: any, count: number) => void;
  users?: { id: string; full_name: string }[];
}

export const BulkDeleteDialog = ({ isOpen, onClose, onConfirm, users }: BulkDeleteDialogProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [nicho, setNicho] = useState<string | undefined>();
  const [responsavelId, setResponsavelId] = useState<string | undefined>();
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  const criteria = {
    start_date: dateRange?.from,
    end_date: dateRange?.to,
    nicho_filter: nicho,
    responsavel_id_filter: responsavelId,
  };

  const debouncedCriteria = useDebounce(criteria, 500);

  useEffect(() => {
    if (!isOpen) {
      setLeadCount(null);
      return;
    }

    const countLeads = async () => {
      setIsCounting(true);
      const { data, error } = await supabase.rpc('count_leads_for_deletion', {
        start_date: debouncedCriteria.start_date ? format(debouncedCriteria.start_date, 'yyyy-MM-dd') : null,
        end_date: debouncedCriteria.end_date ? format(debouncedCriteria.end_date, 'yyyy-MM-dd') : null,
        nicho_filter: debouncedCriteria.nicho_filter || null,
        responsavel_id_filter: debouncedCriteria.responsavel_id_filter || null,
      });
      
      if (error) {
        console.error(error);
        setLeadCount(null);
      } else {
        setLeadCount(data);
      }
      setIsCounting(false);
    };

    countLeads();
  }, [isOpen, debouncedCriteria]);

  const handleConfirm = () => {
    if (leadCount !== null && leadCount > 0) {
      onConfirm(debouncedCriteria, leadCount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Leads em Massa</DialogTitle>
          <DialogDescription>
            Selecione os critérios para excluir leads. Esta ação é irreversível.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Período de Criação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yyyy")) : <span>Selecione um período</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} locale={ptBR} /></PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Nicho</Label>
            <Select onValueChange={(v) => setNicho(v === 'all' ? undefined : v)}><SelectTrigger><SelectValue placeholder="Todos os nichos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os nichos</SelectItem>{NICHOS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select onValueChange={(v) => setResponsavelId(v === 'all' ? undefined : v)}><SelectTrigger><SelectValue placeholder="Todos os responsáveis" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {isCounting ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> : ''}
            {leadCount !== null ? `${leadCount} leads serão excluídos.` : 'Calculando...'}
          </div>
          <div>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isCounting || leadCount === null || leadCount === 0}>
              Excluir {leadCount || 0} Leads
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};