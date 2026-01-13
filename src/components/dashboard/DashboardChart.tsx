import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface DashboardChartProps {
  title: string;
  children: ReactNode;
}

export const DashboardChart = ({ title, children }: DashboardChartProps) => {
  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};