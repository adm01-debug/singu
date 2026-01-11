import { useState, useCallback, useEffect } from 'react';

interface FavoriteItem {
  id: string;
  type: 'contact' | 'company';
  name: string;
  addedAt: string;
}

const FAVORITES_STORAGE_KEY = 'relateiq_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteItem[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const newFavorite: FavoriteItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };
    
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(f => f.id === item.id && f.type === item.type)) {
        return prev;
      }
      const updated = [newFavorite, ...prev];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string, type: 'contact' | 'company') => {
    setFavorites(prev => {
      const updated = prev.filter(f => !(f.id === id && f.type === type));
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const exists = favorites.some(f => f.id === item.id && f.type === item.type);
    if (exists) {
      removeFavorite(item.id, item.type);
      return false;
    } else {
      addFavorite(item);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((id: string, type: 'contact' | 'company') => {
    return favorites.some(f => f.id === id && f.type === type);
  }, [favorites]);

  const getFavoritesByType = useCallback((type: 'contact' | 'company') => {
    return favorites.filter(f => f.type === type);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    setFavorites([]);
  }, []);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    clearFavorites,
    reorderFavorites,
    favoriteContacts: getFavoritesByType('contact'),
    favoriteCompanies: getFavoritesByType('company'),
    contactCount: getFavoritesByType('contact').length,
    companyCount: getFavoritesByType('company').length,
  };
}
