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
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NICHOS } from '@/lib/constants';
import { Label } from '../ui/label';

interface LeadImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().replace(/\r/g, '').split('\n');
  if (lines.length < 2) return [];
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
  const [selectedNiche, setSelectedNiche] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async (leadsToImport: any[]) => {
      if (!user) throw new Error("Usuário não autenticado.");
      if (!selectedNiche) throw new Error("Um nicho deve ser selecionado para a importação.");
      const loadingToast = showLoading("Importando leads... Isso pode levar um momento.");

      try {
        const { data: existingTags, error: tagsError } = await supabase.from('tags').select('id, nome');
        if (tagsError) throw tagsError;
        const tagMap = new Map(existingTags.map(t => [t.nome.toLowerCase(), t.id]));

        const newTagNames = new Set<string>();
        leadsToImport.forEach(lead => {
          if (lead.tags) {
            String(lead.tags).split(',').forEach((tagName: string) => {
              const trimmed = tagName.trim();
              if (trimmed && !tagMap.has(trimmed.toLowerCase())) {
                newTagNames.add(trimmed);
              }
            });
          }
        });

        if (newTagNames.size > 0) {
          const { data: createdTags, error: createTagsError } = await supabase
            .from('tags')
            .insert(Array.from(newTagNames).map(name => ({ nome: name })))
            .select('id, nome');
          if (createTagsError) throw createTagsError;
          createdTags.forEach(t => tagMap.set(t.nome.toLowerCase(), t.id));
        }

        const leadsData = leadsToImport.map(lead => ({
          nome: lead.nome,
          empresa: lead.empresa,
          nicho: lead.nicho || selectedNiche,
          email: lead.email || null,
          whatsapp: lead.whatsapp || null,
          status: lead.status || 'Não contatado',
          observacoes: lead.observacoes || null,
          responsavel_id: user.id,
          site_empresa: lead.site || lead.site_empresa || null,
          cidade: lead.cidade || null,
          tecnologia_atual: lead.tecnologia_atual || lead['Tecnologia Atual'] || null,
          dor_identificada: lead.dor_identificada || lead['Dor Identificada'] || null,
          canal: lead.canal || lead['Canal de Contato'] || 'Prospecção',
        }));

        const { data: insertedLeads, error: leadsInsertError } = await supabase
          .from('leads')
          .insert(leadsData)
          .select('id');
        if (leadsInsertError) throw leadsInsertError;

        const leadTagsRelations: { lead_id: string; tag_id: string }[] = [];
        insertedLeads.forEach((insertedLead, index) => {
          const sourceLead = leadsToImport[index];
          if (sourceLead.tags) {
            String(sourceLead.tags).split(',').forEach((tagName: string) => {
              const tagId = tagMap.get(tagName.trim().toLowerCase());
              if (tagId) {
                leadTagsRelations.push({ lead_id: insertedLead.id, tag_id: tagId });
              }
            });
          }
        });

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
    if (!selectedNiche) {
      showError("Por favor, selecione um nicho para a lista.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        let parsedData: any[];

        if (file.name.endsWith('.csv')) {
            parsedData = parseCSV(fileContent as string);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(fileContent, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
        } else {
            throw new Error("Formato de arquivo não suportado. Use .csv ou .xlsx.");
        }
        
        if (parsedData.length === 0) {
          throw new Error("Arquivo vazio ou sem dados para importar.");
        }

        const requiredColumns = ['nome', 'empresa'];
        const firstRow = parsedData[0];
        for (const col of requiredColumns) {
            if (!(col in firstRow)) {
                throw new Error(`Coluna obrigatória '${col}' não encontrada no arquivo.`);
            }
        }
        
        mutation.mutate(parsedData);
      } catch (error: any) {
        showError(`Erro ao processar arquivo: ${error.message}`);
      }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .csv ou .xlsx e o nicho correspondente para importar uma lista de leads.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              As colunas obrigatórias são: <strong>nome, empresa</strong>. Se a coluna 'nicho' não existir na planilha, o nicho selecionado abaixo será usado para todos os leads.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="niche-select">Para qual nicho essa lista pertence?</Label>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger id="niche-select"><SelectValue placeholder="Selecione um nicho..." /></SelectTrigger>
              <SelectContent>
                {NICHOS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Arquivo</Label>
            <Input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleImport} disabled={!file || !selectedNiche || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};