import { z } from 'zod';

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
  proximo_followup: z.date().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;