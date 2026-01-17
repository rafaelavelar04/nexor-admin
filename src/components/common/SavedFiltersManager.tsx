import { useState } from 'react';
import { useSavedFilters, SavedFilter } from '@/hooks/useSavedFilters';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Save, ListFilter, Trash2, X } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface SavedFiltersManagerProps {
  pageKey: string;
  currentFilters: ColumnFiltersState;
  onApplyFilter: (filters: ColumnFiltersState) => void;
  onClearFilters: () => void;
}

export const SavedFiltersManager = ({ pageKey, currentFilters, onApplyFilter, onClearFilters }: SavedFiltersManagerProps) => {
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters(pageKey);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [filterToDelete, setFilterToDelete] = useState<SavedFilter | null>(null);

  const handleSave = () => {
    if (!newFilterName.trim()) {
      showError("O nome do filtro não pode ser vazio.");
      return;
    }
    if (savedFilters.some(f => f.name.toLowerCase() === newFilterName.trim().toLowerCase())) {
      showError("Já existe um filtro com este nome.");
      return;
    }
    saveFilter(newFilterName.trim(), currentFilters);
    showSuccess(`Filtro "${newFilterName.trim()}" salvo com sucesso!`);
    setNewFilterName('');
    setSavePopoverOpen(false);
  };

  const handleDelete = () => {
    if (filterToDelete) {
      deleteFilter(filterToDelete.id);
      showSuccess(`Filtro "${filterToDelete.name}" excluído.`);
      setFilterToDelete(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ListFilter className="w-4 h-4 mr-2" />
              Filtros Salvos ({savedFilters.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aplicar um filtro</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedFilters.length === 0 ? (
              <DropdownMenuItem disabled>Nenhum filtro salvo</DropdownMenuItem>
            ) : (
              savedFilters.map(filter => (
                <div key={filter.id} className="flex items-center justify-between pr-2">
                  <DropdownMenuItem onClick={() => onApplyFilter(filter.filters)} className="flex-grow cursor-pointer">
                    {filter.name}
                  </DropdownMenuItem>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFilterToDelete(filter)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
          <PopoverTrigger asChild>
            <Button disabled={currentFilters.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Filtro
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium leading-none">Salvar Filtro Atual</h4>
              <p className="text-sm text-muted-foreground">Dê um nome para o seu conjunto de filtros atual.</p>
              <Input
                placeholder="Ex: Leads quentes de SP"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {currentFilters.length > 0 && (
          <Button variant="ghost" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <AlertDialog open={!!filterToDelete} onOpenChange={() => setFilterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o filtro salvo "{filterToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};