import { z } from 'zod';

const decisorSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().optional(),
  telefone: z.string().optional(),
  instagram: z.string().optional(),
  cargo: z.string().optional(),
});

export const leadSchema = z.object({
  nome: z.string().min(1, { message: "O nome é obrigatório." }),
  empresa: z.string().optional(),
  nicho: z.string().optional(),
  responsavel_id: z.string().uuid({ message: "Selecione um responsável." }).optional().nullable(),
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
  consent_given: z.boolean().optional(),
  consent_date: z.date().optional().nullable(),
  consent_origin: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;