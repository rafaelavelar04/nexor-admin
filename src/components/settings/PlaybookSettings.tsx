import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaybookForm } from './PlaybookForm';

export type Playbook = {
  id: string;
  name: string;
  nicho: string;
  steps: PlaybookStep[];
};

export type PlaybookStep = {
  id: string;
  playbook_id: string;
  order: number;
  objective: string;
  checklist: { text: string; completed: boolean }[];
  script: string;
  internal_notes: string;
};

const PlaybookSettings = () => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: playbooks, isLoading } = useQuery<Playbook[]>({
    queryKey: ['playbooksWithSteps'],
    queryFn: async () => {
      const { data, error } = await supabase.from('playbooks').select('*, playbook_steps(*)').order('name');
      if (error) throw error;
      return data.map(p => ({ ...p, steps: p.playbook_steps.sort((a, b) => a.order - b.order) })) || [];
    },
  });

  const handleSelectPlaybook = (playbook: Playbook) => {
    setIsCreating(false);
    setSelectedPlaybook(playbook);
  };

  const handleCreateNew = () => {
    setSelectedPlaybook(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setSelectedPlaybook(null);
    setIsCreating(false);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (isCreating || selectedPlaybook) {
    return <PlaybookForm playbook={selectedPlaybook} onCancel={handleCancel} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Playbooks de Vendas</CardTitle>
            <CardDescription>Crie e gerencie roteiros de vendas por nicho.</CardDescription>
          </div>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Playbook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {playbooks && playbooks.length > 0 ? (
          <div className="space-y-2">
            {playbooks.map(playbook => (
              <div key={playbook.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                <div>
                  <p className="font-semibold">{playbook.name}</p>
                  <p className="text-sm text-muted-foreground">{playbook.nicho}</p>
                </div>
                <Button variant="outline" onClick={() => handleSelectPlaybook(playbook)}>Editar</Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum playbook criado ainda.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaybookSettings;