export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertModule = 'Leads' | 'Oportunidades' | 'Tickets' | 'Metas' | 'Atividades' | 'Segurança';
export type AlertVisibility = 'admin' | 'responsible' | 'both';

export interface AlertRule {
  id: string;
  module: AlertModule;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number; // Represents days, hours, or percentage depending on the rule
  severity: AlertSeverity;
  visibility: AlertVisibility;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  // Leads
  { id: 'lead-stale-followup', module: 'Leads', name: 'Lead sem follow-up', description: 'Alertar quando um lead estiver sem um próximo follow-up agendado por X dias.', enabled: true, threshold: 3, severity: 'warning', visibility: 'both' },
  { id: 'lead-stagnant-convo', module: 'Leads', name: 'Lead estagnado "Em conversa"', description: 'Alertar quando um lead "Em conversa" não for atualizado por X dias.', enabled: true, threshold: 5, severity: 'warning', visibility: 'responsible' },
  { id: 'lead-uncontacted', module: 'Leads', name: 'Lead não contatado', description: 'Alertar quando um lead for criado há X dias e ainda estiver como "Não contatado".', enabled: true, threshold: 2, severity: 'critical', visibility: 'both' },
  
  // Oportunidades
  { id: 'opp-stagnant-stage', module: 'Oportunidades', name: 'Oportunidade estagnada', description: 'Alertar quando uma oportunidade permanecer no mesmo estágio por mais de X dias.', enabled: true, threshold: 7, severity: 'warning', visibility: 'both' },
  { id: 'opp-high-value-no-action', module: 'Oportunidades', name: 'Oportunidade de alto valor sem ação', description: 'Alertar quando uma oportunidade acima de R$ X não for atualizada há 3 dias.', enabled: true, threshold: 10000, severity: 'critical', visibility: 'admin' },

  // Tickets
  { id: 'ticket-stale', module: 'Tickets', name: 'Ticket sem resposta', description: 'Alertar quando um ticket aberto não for atualizado por X horas.', enabled: true, threshold: 24, severity: 'warning', visibility: 'both' },
  { id: 'ticket-urgent-stale', module: 'Tickets', name: 'Ticket urgente sem resposta', description: 'Alertar quando um ticket de prioridade "alta" não for atualizado por X horas.', enabled: true, threshold: 6, severity: 'critical', visibility: 'both' },

  // Segurança
  { id: 'security-new-device', module: 'Segurança', name: 'Novo Dispositivo Detectado', description: 'Um usuário fez login a partir de um novo dispositivo ou navegador.', enabled: true, threshold: 1, severity: 'info', visibility: 'admin' },
  { id: 'security-new-ip', module: 'Segurança', name: 'Novo Endereço IP Detectado', description: 'Um usuário fez login a partir de um novo endereço IP.', enabled: true, threshold: 1, severity: 'warning', visibility: 'admin' },
  { id: 'security-off-hours', module: 'Segurança', name: 'Acesso Fora do Horário Comercial', description: 'Um usuário acessou o sistema fora do horário comercial (8h-20h).', enabled: true, threshold: 8, severity: 'info', visibility: 'admin' },
  { id: 'security-rapid-ip-change', module: 'Segurança', name: 'Múltiplos IPs em Curto Período', description: 'Um usuário se conectou de múltiplos IPs em menos de 24 horas.', enabled: true, threshold: 2, severity: 'critical', visibility: 'admin' },
];