import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, Layers, Edit, Calendar } from "lucide-react";
import { getFollowUpStatus } from "@/lib/followupUtils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from "@/lib/formatters";

export const OpportunityHeader = ({ opportunity, canEdit }: { opportunity: any, canEdit: boolean }) => {
  const statusStyles = {
    open: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 capitalize',
    won: 'bg-green-500/20 text-green-300 border-green-500/30 capitalize',
    lost: 'bg-red-500/20 text-red-300 border-red-500/30 capitalize',
  };

  const followUpStatus = getFollowUpStatus(opportunity.proximo_followup);

  return (
    <div className="p-4 sm:p-6 bg-card border rounded-lg">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{opportunity.titulo}</h1>
          <p className="text-muted-foreground mt-1">Lead: {opportunity.lead?.nome} @ {opportunity.lead?.empresa}</p>
        </div>
        {canEdit && (
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge className={statusStyles[opportunity.status]}>{opportunity.status}</Badge>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <DollarSign className="w-5 h-5 text-primary" />
          <span>{formatCurrency(opportunity.valor_estimado)}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <User className="w-5 h-5 text-primary" />
          <span>{opportunity.responsavel?.full_name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <Layers className="w-5 h-5 text-primary" />
          <span>{opportunity.pipeline_stage?.nome || 'N/A'}</span>
        </div>
        {followUpStatus && opportunity.proximo_followup && (
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-foreground">{format(new Date(opportunity.proximo_followup), 'dd/MM/yyyy', { locale: ptBR })}</span>
            <Badge variant={followUpStatus.variant} className={followUpStatus.className}>{followUpStatus.text}</Badge>
          </div>
        )}
      </div>
    </div>
  );
};