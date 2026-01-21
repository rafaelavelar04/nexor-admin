export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertModule = 'Leads' | 'Oportunidades' | 'Tickets' | 'Metas' | 'Financeiro' | 'Segurança';
export type AlertVisibility = 'admin' | 'responsible' | 'both';

export interface AlertRule {
  id: string;
  module: AlertModule;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number;
  severity: AlertSeverity;
  visibility: AlertVisibility;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  // Leads
  { id: 'lead-uncontacted', module: 'Leads', name: 'Lead não contatado', description: 'Alertar quando um lead for criado há X dias e ainda estiver como "Não contatado".', enabled: true, threshold: 2, severity: 'critical', visibility: 'both' },
  { id: 'lead-followup-overdue', module: 'Leads', name: 'Follow-up de Lead Atrasado', description: 'Alertar quando a data do "próximo follow-up" de um lead estiver no passado há mais de X dias.', enabled: true, threshold: 1, severity: 'warning', visibility: 'responsible' },
  
  // Oportunidades
  { id: 'opp-stagnant-stage', module: 'Oportunidades', name: 'Oportunidade estagnada', description: 'Alertar quando uma oportunidade permanecer no mesmo estágio por mais de X dias.', enabled: true, threshold: 7, severity: 'warning', visibility: 'both' },

  // Tickets
  { id: 'ticket-stale', module: 'Tickets', name: 'Ticket sem resposta', description: 'Alertar quando um ticket aberto não for atualizado por X horas.', enabled: true, threshold: 24, severity: 'warning', visibility: 'both' },
  { id: 'ticket-urgent-stale', module: 'Tickets', name: 'Ticket urgente sem resposta', description: 'Alertar quando um ticket de prioridade "alta" não for atualizado por X horas.', enabled: true, threshold: 6, severity: 'critical', visibility: 'both' },

  // Metas
  { id: 'goal-at-risk', module: 'Metas', name: 'Meta em Risco', description: 'Na 2ª quinzena do mês, alertar se a meta estiver abaixo de X% de atingimento.', enabled: true, threshold: 40, severity: 'warning', visibility: 'both' },

  // Financeiro
  { id: 'receivable-overdue', module: 'Financeiro', name: 'Recebível Atrasado', description: 'Alertar quando um recebível passar da data de vencimento e não for pago.', enabled: true, threshold: 1, severity: 'critical', visibility: 'admin' },
  { id: 'cost-unpaid', module: 'Financeiro', name: 'Custo Previsto Antigo', description: 'Alertar sobre custos previstos que não foram pagos por mais de X dias.', enabled: true, threshold: 15, severity: 'warning', visibility: 'admin' },

  // Segurança
  { id: 'security-new-device', module: 'Segurança', name: 'Novo Dispositivo Detectado', description: 'Um usuário fez login a partir de um novo dispositivo ou navegador.', enabled: true, threshold: 1, severity: 'info', visibility: 'admin' },
  { id: 'security-new-ip', module: 'Segurança', name: 'Novo Endereço IP Detectado', description: 'Um usuário fez login a partir de um novo endereço IP.', enabled: true, threshold: 1, severity: 'warning', visibility: 'admin' },
  { id: 'security-off-hours', module: 'Segurança', name: 'Acesso Fora do Horário Comercial', description: 'Um usuário acessou o sistema fora do horário comercial (8h-20h).', enabled: true, threshold: 8, severity: 'info', visibility: 'admin' },
  { id: 'security-rapid-ip-change', module: 'Segurança', name: 'Múltiplos IPs em Curto Período', description: 'Um usuário se conectou de múltiplos IPs em menos de 24 horas.', enabled: true, threshold: 2, severity: 'critical', visibility: 'admin' },
];