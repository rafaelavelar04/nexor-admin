import { useState, useCallback } from 'react';
import { ColumnFiltersState } from '@tanstack/react-table';

const SAVED_FILTERS_STORAGE_KEY = 'nexor-saved-filters';

export interface SavedFilter {
  id: string;
  name: string;
  filters: ColumnFiltersState;
}

type AllSavedFilters = Record<string, SavedFilter[]>;

export const useSavedFilters = (pageKey: string) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const item = window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY);
      if (item) {
        const allFilters = JSON.parse(item) as AllSavedFilters;
        return allFilters[pageKey] || [];
      }
    } catch (error) {
      console.error("Error reading saved filters from localStorage", error);
    }
    return [];
  });

  const updateStorage = (allFilters: AllSavedFilters) => {
    window.localStorage.setItem(SAVED_FILTERS_STORAGE_KEY, JSON.stringify(allFilters));
  };

  const saveFilter = useCallback((name: string, filters: ColumnFiltersState) => {
    const newFilter: SavedFilter = { id: crypto.randomUUID(), name, filters };
    
    setSavedFilters(prev => {
      const updatedFilters = [...prev, newFilter];
      const allFilters = JSON.parse(window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY) || '{}') as AllSavedFilters;
      allFilters[pageKey] = updatedFilters;
      updateStorage(allFilters);
      return updatedFilters;
    });
  }, [pageKey]);

  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updatedFilters = prev.filter(f => f.id !== id);
      const allFilters = JSON.parse(window.localStorage.getItem(SAVED_FILTERS_STORAGE_KEY) || '{}') as AllSavedFilters;
      allFilters[pageKey] = updatedFilters;
      updateStorage(allFilters);
      return updatedFilters;
    });
  }, [pageKey]);

  return { savedFilters, saveFilter, deleteFilter };
};