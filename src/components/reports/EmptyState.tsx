import { BarChart3 } from 'lucide-react';

export const EmptyState = ({ message = "Não há dados para exibir no período selecionado." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-48 text-center rounded-lg bg-secondary/50">
    <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);