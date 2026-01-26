import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { showSuccess } from '@/utils/toast';

interface CacheManagerContextValue {
  hardRefresh: () => void;
}

const CacheManagerContext = createContext<CacheManagerContextValue | undefined>(undefined);

export const CacheManagerProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const hardRefresh = useCallback(() => {
    showSuccess("Atualizando todos os dados...");
    queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <CacheManagerContext.Provider value={{ hardRefresh }}>
      {children}
    </CacheManagerContext.Provider>
  );
};

export const useCacheManager = () => {
  const context = useContext(CacheManagerContext);
  if (context === undefined) {
    throw new Error('useCacheManager must be used within a CacheManagerProvider');
  }
  return context;
};