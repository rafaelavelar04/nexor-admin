import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface LeadImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple CSV parser
const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return header.reduce((obj, col, index) => {
      obj[col] = values[index]?.trim() || '';
      return obj;
    }, {} as Record<string, string>);
  });
};

export const LeadImportDialog = ({ isOpen, onClose }: LeadImportDialogProps) => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (leadsToImport: any[]) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const loadingToast = showLoading("Importando leads... Isso pode levar um momento.");

      try {
        // 1. Fetch all existing tags
        const { data: existingTags, error: tagsError } = await supabase.from('tags').select('id, nome');
        if (tagsError) throw tagsError;
        const tagMap = new Map(existingTags.map(t => [t.nome.toLowerCase(), t.id]));

        // 2. Identify new tags to be created
        const newTagNames = new Set<string>();
        leadsToImport.forEach(lead => {
          if (lead.tags) {
            lead.tags.split(',').forEach((tagName: string) => {
              const trimmed = tagName.trim();
              if (trimmed && !tagMap.has(trimmed.toLowerCase())) {
                newTagNames.add(trimmed);
              }
            });
          }
        });

        // 3. Create new tags if any
        if (newTagNames.size > 0) {
          const { data: createdTags, error: createTagsError } = await supabase
            .from('tags')
            .insert(Array.from(newTagNames).map(name => ({ nome: name })))
            .select('id, nome');
          if (createTagsError) throw createTagsError;
          createdTags.forEach(t => tagMap.set(t.nome.toLowerCase(), t.id));
        }

        // 4. Prepare leads for insertion
        const leadsData = leadsToImport.map(lead => ({
          nome: lead.nome,
          empresa: lead.empresa,
          nicho: lead.nicho,
          email: lead.email || null,
          whatsapp: lead.whatsapp || null,
          status: lead.status || 'Não contatado',
          observacoes: lead.observacoes || null,
          responsavel_id: user.id,
        }));

        // 5. Insert leads
        const { data: insertedLeads, error: leadsInsertError } = await supabase
          .from('leads')
          .insert(leadsData)
          .select('id');
        if (leadsInsertError) throw leadsInsertError;

        // 6. Prepare lead_tags relationships
        const leadTagsRelations: { lead_id: string; tag_id: string }[] = [];
        insertedLeads.forEach((insertedLead, index) => {
          const sourceLead = leadsToImport[index];
          if (sourceLead.tags) {
            sourceLead.tags.split(',').forEach((tagName: string) => {
              const tagId = tagMap.get(tagName.trim().toLowerCase());
              if (tagId) {
                leadTagsRelations.push({ lead_id: insertedLead.id, tag_id: tagId });
              }
            });
          }
        });

        // 7. Insert relationships
        if (leadTagsRelations.length > 0) {
          const { error: relationsError } = await supabase.from('lead_tags').insert(leadTagsRelations);
          if (relationsError) throw relationsError;
        }

        return { count: insertedLeads.length };
      } finally {
        dismissToast(loadingToast);
      }
    },
    onSuccess: ({ count }) => {
      showSuccess(`${count} leads importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onClose();
    },
    onError: (error: any) => {
      showError(`Erro na importação: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      showError("Por favor, selecione um arquivo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0 || !parsedData[0].nome || !parsedData[0].empresa || !parsedData[0].nicho) {
          throw new Error("Arquivo inválido ou vazio. Verifique se as colunas 'nome', 'empresa' e 'nicho' existem.");
        }
        
        mutation.mutate(parsedData);
      } catch (error: any) {
        showError(`Erro ao processar arquivo: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .csv para importar uma lista de leads.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Use o mesmo formato de colunas do arquivo de exportação para garantir uma importação correta. As colunas obrigatórias são: <strong>nome, empresa, nicho</strong>.
            </AlertDescription>
          </Alert>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleImport} disabled={!file || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};