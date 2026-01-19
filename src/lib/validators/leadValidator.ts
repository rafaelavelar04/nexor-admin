import { z } from 'zod';

const decisorSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(3, { message: "O nome do decisor é obrigatório." }),
  telefone: z.string().optional(),
  instagram: z.string().optional(),
  cargo: z.string().optional(),
});

export const leadSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  empresa: z.string().min(2, { message: "O nome da empresa é obrigatório." }),
  nicho: z.string().min(3, { message: "O nicho é obrigatório." }),
  responsavel_id: z.string().uuid({ message: "Selecione um responsável." }),
  status: z.string(),
  cargo: z.string().optional(),
  email: z.string().email({ message: "Digite um e-mail válido." }).optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  observacoes: z.string().optional(),
  proximo_followup: z.date().optional().nullable(),
  telefone_empresa: z.string().optional(),
  instagram_empresa: z.string().optional(),
  site_empresa: z.string().optional(),
  decisores: z.array(decisorSchema).optional(),
  cidade: z.string().optional(),
  tecnologia_atual: z.string().optional(),
  dor_identificada: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;