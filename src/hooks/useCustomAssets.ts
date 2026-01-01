import { useState, useCallback, useEffect } from 'react';
import { CustomAsset } from '@/types/customAssets';
import {
  getCustomAssets,
  getCustomAssetBySymbol,
  getCustomAssetById,
  saveCustomAsset,
  updateCustomAsset,
  deleteCustomAsset,
  hasCustomAsset,
  hasCustomOverride,
  validateCustomAsset,
} from '@/services/customAssetsService';

export function useCustomAssets() {
  const [assets, setAssets] = useState<CustomAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load assets on mount
  useEffect(() => {
    try {
      const loaded = getCustomAssets();
      setAssets(loaded);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load custom assets';
      setError(message);
      console.error('Error loading custom assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new asset
  const createAsset = useCallback(
    (asset: Omit<CustomAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newAsset = saveCustomAsset(asset);
        setAssets((prev) => [newAsset, ...prev]);
        setError(null);
        return newAsset;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create asset';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Update asset
  const updateAsset = useCallback((id: string, updates: Partial<Omit<CustomAsset, 'id' | 'createdAt'>>) => {
    try {
      const updated = updateCustomAsset(id, updates);
      setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setError(null);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update asset';
      setError(message);
      throw err;
    }
  }, []);

  // Delete asset
  const removeAsset = useCallback((id: string) => {
    try {
      deleteCustomAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(message);
      throw err;
    }
  }, []);

  // Get asset by symbol
  const getAssetBySymbol = useCallback((symbol: string) => {
    return assets.find((a) => a.symbol === symbol);
  }, [assets]);

  // Get asset by id
  const getAssetById = useCallback((id: string) => {
    return assets.find((a) => a.id === id);
  }, [assets]);

  // Check if symbol has custom asset
  const isCustomSymbol = useCallback((symbol: string) => {
    return assets.some((a) => a.symbol === symbol && a.type === 'custom');
  }, [assets]);

  // Check if symbol has override
  const hasOverride = useCallback((symbol: string) => {
    return assets.some((a) => a.symbol === symbol && a.type === 'override');
  }, [assets]);

  // Validate asset
  const validate = useCallback((asset: Partial<CustomAsset>) => {
    return validateCustomAsset(asset);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    assets,
    loading,
    error,
    clearError,
    createAsset,
    updateAsset,
    removeAsset,
    getAssetBySymbol,
    getAssetById,
    isCustomSymbol,
    hasOverride,
    validate,
  };
}
