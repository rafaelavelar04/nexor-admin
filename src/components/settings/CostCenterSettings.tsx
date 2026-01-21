import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showSuccess, showError } from '@/utils/toast';
import { CostCenter, CostCenterFormDialog } from './CostCenterFormDialog';

const CostCenterSettings = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);

  const { data: costCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('*').order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (costCenter: CostCenter) => {
      const { error } = await supabase.from('cost_centers').update({ ativo: costCenter.ativo }).eq('id', costCenter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] });
    },
    onError: (error: any) => showError(`Erro: ${error.message}`),
  });

  const handleEdit = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCostCenter(null);
    setIsFormOpen(true);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Centros de Custo</CardTitle>
              <CardDescription>Gerencie os centros de custo para categorização financeira.</CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Centro de Custo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCenters?.map(cc => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-medium">{cc.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{cc.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cc.ativo}
                          onCheckedChange={(checked) => updateMutation.mutate({ ...cc, ativo: checked })}
                        />
                        <Badge variant={cc.ativo ? 'default' : 'destructive'} className={cc.ativo ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
                          {cc.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cc)}>Editar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <CostCenterFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        costCenter={selectedCostCenter}
      />
    </>
  );
};

export default CostCenterSettings;