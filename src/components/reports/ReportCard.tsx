import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReactNode } from 'react';

interface ReportCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const ReportCard = ({ title, description, children, className }: ReportCardProps) => (
  <Card className={`bg-secondary border-border ${className}`}>
    <CardHeader>
      <CardTitle className="text-base font-medium text-foreground">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);