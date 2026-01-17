import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface InsightCardProps {
  title: string;
  value: string | number;
  change?: number;
  interpretation: string;
  link?: string;
  children?: ReactNode;
}

const ChangeIndicator = ({ change }: { change?: number }) => {
  if (change === undefined || isNaN(change) || !isFinite(change)) {
    return <span className="text-muted-foreground"><ArrowRight className="inline h-4 w-4" /> --</span>;
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const colorClass = isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted-foreground";
  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : ArrowRight;

  return (
    <span className={`flex items-center font-semibold ${colorClass}`}>
      <Icon className="h-4 w-4 mr-1" />
      {Math.abs(change).toFixed(1)}%
    </span>
  );
};

export const InsightCard = ({ title, value, change, interpretation, link, children }: InsightCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-4">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <ChangeIndicator change={change} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{interpretation}</p>
        {children && <div className="mt-4 h-24">{children}</div>}
        {link && (
          <Button variant="link" asChild className="p-0 h-auto mt-2 text-cyan-400">
            <Link to={link}>Ver detalhes</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};