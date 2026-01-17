import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardHeader, CardTitle } from '@/components/ui/card';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartConfig {
  type: ChartType;
}

interface ChartConfiguratorProps {
  title: string;
  config: ChartConfig;
  setConfig: (config: ChartConfig) => void;
  availableTypes: { value: ChartType; label: string }[];
}

export const ChartConfigurator = ({ title, config, setConfig, availableTypes }: ChartConfiguratorProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base font-medium text-foreground">{title}</CardTitle>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 space-y-4" align="end">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Configurações do Gráfico</h4>
            <p className="text-sm text-muted-foreground">Personalize a visualização.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart-type">Tipo de Gráfico</Label>
            <Select
              value={config.type}
              onValueChange={(value: ChartType) => setConfig({ ...config, type: value })}
            >
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </CardHeader>
  );
};