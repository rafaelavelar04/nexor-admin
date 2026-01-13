import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadsDataTable } from '@/components/leads/LeadsDataTable';
import { getColumns, Lead } from '@/components/leads/LeadsTableColumns';
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const LeadsPage = () => {
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      // This function is defined inside useEffect to capture isMounted
      // and to adhere to the no-dependencies rule.
      try {
        // No need to set loading true here, it's true by default
        const { data, error: fetchError } = await supabase
          .from('leads')
          .select(`
            *,
            profile:profiles(full_name),
            tags(*)
          `)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (isMounted) {
          const formattedData = data.map(lead => ({
            ...lead,
            profile: Array.isArray(lead.profile) ? lead.profile[0] : lead.profile,
            nome_empresa: `${lead.nome} ${lead.empresa}`
          })) as Lead[];
          setLeads(formattedData);
        }
      } catch (err: any) {
        console.error("Erro ao carregar os leads:", err);
        if (isMounted) {
          setError(err.message || 'Ocorreu um erro desconhecido.');
          setLeads([]); // Ensure leads is an empty array on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array as per the requirement

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id; // Return the ID of the deleted lead
    },
    onSuccess: (deletedId) => {
      showSuccess('Lead excluído com sucesso!');
      // Manually update local state to reflect the deletion
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== deletedId));
      // Invalidate the query in the cache for data consistency if the user navigates away and back
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Leads</h1>
      <p className="text-gray-400 mt-2 mb-6">Gerencie seus leads de prospecção.</p>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 bg-red-900/20 p-4 rounded-md">
          <strong>Erro ao carregar os leads:</strong> {error}
        </div>
      ) : (
        <LeadsDataTable columns={columns} data={leads} />
      )}
    </div>
  );
};

export default LeadsPage;