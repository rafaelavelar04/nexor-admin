export const PERMISSION_TEMPLATES: Record<string, string[]> = {
  'Admin': [
    'leads.create', 'leads.read.all', 'leads.update.all', 'leads.delete.all', 'leads.export', 'leads.import', 'leads.assign',
    'opportunities.create', 'opportunities.read.all', 'opportunities.update.all', 'opportunities.delete.all',
    'users.manage', 'settings.manage',
    'finance.read', 'finance.read.sensitive',
    'tickets.manage', 'activities.manage',
  ],
  'Gerente Comercial': [
    'leads.create', 'leads.read.all', 'leads.update.all', 'leads.delete.all', 'leads.export', 'leads.import', 'leads.assign',
    'opportunities.create', 'opportunities.read.all', 'opportunities.update.all', 'opportunities.delete.all',
    'finance.read', 'finance.read.sensitive',
    'tickets.manage', 'activities.manage',
  ],
  'Vendas': [
    'leads.create', 'leads.read.own', 'leads.update.own', 'leads.export',
    'opportunities.create', 'opportunities.read.own', 'opportunities.update.own',
    'tickets.manage', 'activities.manage',
  ],
  'Operações': [
    'leads.read.all',
    'opportunities.read.all',
    'tickets.manage',
    'activities.manage',
    'finance.read',
  ],
  'Viewer': [
    'leads.read.all',
    'opportunities.read.all',
    'activities.manage',
  ],
};