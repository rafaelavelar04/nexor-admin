import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: {
    text: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, cta }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg text-center p-4 bg-secondary/30">
      <div className="w-16 h-16 text-muted-foreground mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 max-w-sm">{description}</p>
      {cta && (
        <Button onClick={cta.onClick} className="mt-6">
          {cta.text}
        </Button>
      )}
    </div>
  );
};