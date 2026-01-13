import { z } from 'zod';

export const companySchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  segmento: z.string().optional(),
  site: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  observacoes: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;