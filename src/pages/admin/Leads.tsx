import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { showSuccess, showError } from '@/utils/toast';

const LeadsPage = () => {
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      
      // Supabase returns an array for the relation, so we flatten it
      return data.map(lead => ({
        ...lead,
        profile: Array.isArray(lead.profile) ? lead.profile[0] : lead.profile,
        nome_empresa: `${lead.nome} ${lead.empresa}`
      })) as Lead[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Lead excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      showError(`Erro ao excluir lead: ${error.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = useMemo(() => getColumns(handleDelete), []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-400">Erro ao carregar os leads: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Leads</h1>
      <p className="text-gray-400 mt-2 mb-6">Gerencie seus leads de prospecção.</p>
      <LeadsDataTable columns={columns} data={leads || []} />
    </div>
  );
};

export default LeadsPage;