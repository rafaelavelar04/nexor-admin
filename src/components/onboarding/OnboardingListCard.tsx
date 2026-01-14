import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';

const statusStyles = {
  em_onboarding: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  concluido: "bg-green-500/20 text-green-300 border-green-500/30",
  pausado: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export const OnboardingListCard = ({ onboarding }: { onboarding: any }) => {
  const navigate = useNavigate();
  const { id, companies, profiles, status, start_date, progress, completed_steps, total_steps } = onboarding;

  return (
    <Card 
      className="bg-secondary border-border hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/admin/onboarding/${id}`)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-foreground">{companies?.nome || "Empresa não encontrada"}</CardTitle>
            <CardDescription className="pt-1">
              Iniciado em: {format(new Date(start_date), 'dd/MM/yyyy')}
            </CardDescription>
          </div>
          <Badge className={statusStyles[status as keyof typeof statusStyles] || "bg-gray-500/20"}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="text-sm text-muted-foreground flex justify-between">
          <span>{completed_steps} de {total_steps} etapas concluídas</span>
          <span>Responsável: {profiles?.full_name || 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  );
};