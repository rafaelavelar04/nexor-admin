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

// ... (funções parseCSV, parseInstagramUsername, normalizePhone permanecem as mesmas) ...
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

const parseInstagramUsername = (rawInput: any): string | null => {
  if (!rawInput || typeof rawInput !== 'string') {
    return null;
  }
  let username = rawInput.trim().toLowerCase();
  username = username.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '');
  if (username.startsWith('@')) {
    username = username.substring(1);
  }
  username = username.split('/')[0];
  const instagramRegex = /^[a-z0-9._]{1,30}$/;
  if (instagramRegex.test(username)) {
    return username;
  }
  return null;
};

const normalizePhone = (phone: string | null | undefined) => {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
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
      const loadingToast = showLoading("Iniciando importação...");

      try {
        // 1. Criar registro de importação
        const { data: importRecord, error: importError } = await supabase
          .from('lead_imports')
          .insert({ user_id: user.id, filename: file?.name, total_rows: leadsToImport.length })
          .select()
          .single();
        if (importError) throw importError;
        const importId = importRecord.id;

        dismissToast(loadingToast);
        showLoading("Verificando duplicados e importando leads...");

        // 2. Buscar dados existentes para verificação de duplicidade
        const { data: existingLeads, error: fetchError } = await supabase
          .from('leads')
          .select('email, whatsapp, instagram_empresa');
        if (fetchError) throw fetchError;

        const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase().trim()).filter(Boolean));
        const existingPhones = new Set(existingLeads.map(l => normalizePhone(l.whatsapp)).filter(Boolean));
        const existingInstagrams = new Set(existingLeads.map(l => l.instagram_empresa).filter(Boolean));

        let ignoredDuplicateCount = 0;
        const leadsToInsert = [];

        const instagramColumnKeys = ['instagram', 'instagram_empresa', 'ig', 'insta', 'instagram url', 'instagram_empresa_url'];
        const findValue = (lead: any, keys: string[]): string | undefined => {
          const lowerCaseLead: Record<string, any> = {};
          for (const key in lead) {
            lowerCaseLead[key.toLowerCase().trim()] = lead[key];
          }
          for (const key of keys) {
            if (lowerCaseLead[key]) return lowerCaseLead[key];
          }
          return undefined;
        };

        for (const lead of leadsToImport) {
          const email = lead.email?.toLowerCase().trim();
          const phone = normalizePhone(lead.whatsapp);
          const rawInstagram = findValue(lead, instagramColumnKeys);
          const instagram = parseInstagramUsername(rawInstagram);

          if ((email && existingEmails.has(email)) || (phone && existingPhones.has(phone)) || (instagram && existingInstagrams.has(instagram))) {
            ignoredDuplicateCount++;
            continue;
          }

          const leadData = {
            import_id: importId, // Vincular ao registro de importação
            nome: lead.nome,
            empresa: lead.empresa,
            nicho: lead.nicho || selectedNiche,
            email: email || null,
            whatsapp: lead.whatsapp || null,
            status: lead.status || 'Não contatado',
            responsavel_id: user.id,
            instagram_empresa: instagram,
            // ... outros campos
          };
          leadsToInsert.push(leadData);
          if (email) existingEmails.add(email);
          if (phone) existingPhones.add(phone);
          if (instagram) existingInstagrams.add(instagram);
        }

        if (leadsToInsert.length > 0) {
          const { error: leadsInsertError } = await supabase.from('leads').insert(leadsToInsert);
          if (leadsInsertError) throw leadsInsertError;
        }

        // 3. Atualizar o registro de importação com o resultado
        const { error: updateError } = await supabase
          .from('lead_imports')
          .update({ success_rows: leadsToInsert.length, error_rows: ignoredDuplicateCount })
          .eq('id', importId);
        if (updateError) throw updateError;

        return { createdCount: leadsToInsert.length, ignoredDuplicateCount };
      } finally {
        dismissToast(loadingToast);
      }
    },
    onSuccess: ({ createdCount, ignoredDuplicateCount }) => {
      showSuccess(`${createdCount} leads importados com sucesso!`, {
        description: `${ignoredDuplicateCount} ignorados por duplicidade.`,
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead_imports'] });
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
        const lowerCaseHeaders = Object.keys(firstRow).map(h => h.toLowerCase());
        for (const col of requiredColumns) {
            if (!lowerCaseHeaders.includes(col)) {
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