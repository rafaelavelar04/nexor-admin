import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface MonthlyGoalCardProps {
  title: string;
  target: number;
  achieved: number;
}

export const MonthlyGoalCard = ({ title, target, achieved }: MonthlyGoalCardProps) => {
  const percentage = target > 0 ? (achieved / target) * 100 : 0;

  return (
    <Card className="bg-secondary border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{currencyFormatter.format(achieved)}</div>
        <p className="text-xs text-muted-foreground">
          Meta de {currencyFormatter.format(target)}
        </p>
        <Progress value={percentage} className="mt-4 h-2" />
      </CardContent>
    </Card>
  );
};