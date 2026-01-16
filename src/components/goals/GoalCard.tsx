import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const GoalCard = ({ goal }: { goal: any }) => {
  const { valor, achieved, mes, ano, profiles } = goal;
  const percentage = valor > 0 ? (achieved / valor) * 100 : 0;
  const isAchieved = percentage >= 100;

  return (
    <Card className="bg-secondary border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-foreground">Meta de {monthNames[mes - 1]}/{ano}</CardTitle>
            {profiles?.full_name ? (
              <CardDescription className="flex items-center gap-2 pt-1">
                <User className="w-3 h-3" /> {profiles.full_name}
              </CardDescription>
            ) : (
              <CardDescription className="pt-1">Meta Global</CardDescription>
            )}
          </div>
          <Badge className={isAchieved ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"}>
            {isAchieved ? "Atingida" : "Em Andamento"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percentage} className="h-3" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatCurrency(achieved)}</span> / {formatCurrency(valor)}
          <span className="float-right font-medium text-primary">{percentage.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );
};