import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Period = '7d' | '30d' | '90d' | 'this_month' | 'last_month';

interface PeriodFilterProps {
  period: Period;
  setPeriod: (period: Period) => void;
}

export const PeriodFilter = ({ period, setPeriod }: PeriodFilterProps) => {
  return (
    <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Últimos 7 dias</SelectItem>
        <SelectItem value="30d">Últimos 30 dias</SelectItem>
        <SelectItem value="90d">Últimos 90 dias</SelectItem>
        <SelectItem value="this_month">Este mês</SelectItem>
        <SelectItem value="last_month">Mês passado</SelectItem>
      </SelectContent>
    </Select>
  );
};