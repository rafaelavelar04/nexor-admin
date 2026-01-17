export const WEBHOOK_EVENTS = {
  Leads: [
    { id: 'lead.created', name: 'Lead Criado' },
    { id: 'lead.updated', name: 'Lead Atualizado' },
    { id: 'lead.status_changed', name: 'Status do Lead Alterado' },
    { id: 'lead.assigned', name: 'Lead Atribuído' },
    { id: 'lead.deleted', name: 'Lead Excluído' },
  ],
  Oportunidades: [
    { id: 'opportunity.created', name: 'Oportunidade Criada' },
    { id: 'opportunity.stage_changed', name: 'Estágio da Oportunidade Alterado' },
    { id: 'opportunity.won', name: 'Oportunidade Ganha' },
    { id: 'opportunity.lost', name: 'Oportunidade Perdida' },
  ],
  Tickets: [
    { id: 'ticket.created', name: 'Ticket Criado' },
    { id: 'ticket.status_changed', name: 'Status do Ticket Alterado' },
    { id: 'ticket.closed', name: 'Ticket Fechado' },
  ],
  Atividades: [
    { id: 'activity.created', name: 'Atividade Criada' },
    { id: 'activity.completed', name: 'Atividade Concluída' },
    { id: 'activity.overdue', name: 'Atividade Atrasada' },
  ],
  Usuários: [
    { id: 'user.created', name: 'Usuário Criado' },
    { id: 'user.updated', name: 'Usuário Atualizado' },
    { id: 'user.deactivated', name: 'Usuário Desativado' },
  ],
};

export const ALL_EVENTS = Object.values(WEBHOOK_EVENTS).flat();