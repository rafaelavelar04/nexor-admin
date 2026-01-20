import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface AIOpsInsightCardProps {
  icon: ReactNode;
  title: string;
  insight: string;
  explanation: string;
}

export const AIOpsInsightCard = ({ icon, title, insight, explanation }: AIOpsInsightCardProps) => {
  return (
    <Card className="bg-secondary/50 border-dashed border-primary/30">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          <p className="text-2xl font-bold text-primary mt-1">{insight}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{explanation}</p>
      </CardContent>
    </Card>
  );
};