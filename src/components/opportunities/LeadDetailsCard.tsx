import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Building, Briefcase, Mail, Phone, FileText } from "lucide-react";

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null | undefined }) => (
  <div className="flex items-start">
    <div className="w-6 text-cyan-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-white">{value || 'N/A'}</p>
    </div>
  </div>
);

export const LeadDetailsCard = ({ lead }: { lead: any }) => {
  if (!lead) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-white">Detalhes do Lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailItem icon={<User size={16} />} label="Nome" value={lead.nome} />
        <DetailItem icon={<Building size={16} />} label="Empresa" value={lead.empresa} />
        <DetailItem icon={<Briefcase size={16} />} label="Nicho" value={lead.nicho} />
        <DetailItem icon={<Mail size={16} />} label="Email" value={lead.email} />
        <DetailItem icon={<Phone size={16} />} label="WhatsApp" value={lead.whatsapp} />
        <DetailItem icon={<FileText size={16} />} label="Observações" value={lead.observacoes} />
      </CardContent>
    </Card>
  );
};