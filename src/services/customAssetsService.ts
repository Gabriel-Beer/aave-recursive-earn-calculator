import { CustomAsset, CustomAssetsStorage, ValidationResult } from '@/types/customAssets';

const STORAGE_KEY = 'aave-calculator-custom-assets';
const STORAGE_VERSION = 1;
const MAX_CUSTOM_ASSETS = 50;

/**
 * Initialize or get localStorage data
 */
function getStorageData(): CustomAssetsStorage {
  try {
    if (typeof window === 'undefined') {
      return { version: STORAGE_VERSION, assets: [] };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { version: STORAGE_VERSION, assets: [] };
    }

    const parsed = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Custom assets storage version mismatch, returning empty');
      return { version: STORAGE_VERSION, assets: [] };
    }

    return parsed;
  } catch (error) {
    console.error('Error reading custom assets from localStorage:', error);
    return { version: STORAGE_VERSION, assets: [] };
  }
}

/**
 * Save storage data to localStorage
 */
function saveStorageData(data: CustomAssetsStorage): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving custom assets to localStorage:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage limit exceeded. Please delete some custom assets.');
    }
  }
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate custom asset data
 */
export function validateCustomAsset(asset: Partial<CustomAsset>): ValidationResult {
  const errors: string[] = [];

  // Required: symbol
  if (!asset.symbol) {
    errors.push('Symbol is required');
  } else if (!/^[A-Z0-9]{2,10}$/.test(asset.symbol)) {
    errors.push('Symbol must be 2-10 uppercase letters and numbers');
  } else {
    // Check for duplicates (excluding self if editing)
    const existing = getCustomAssets();
    if (existing.some((a) => a.symbol === asset.symbol && a.id !== asset.id)) {
      errors.push(`Symbol "${asset.symbol}" already exists`);
    }
  }

  // Required: name
  if (!asset.name || asset.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Required: LTV
  if (asset.ltv === undefined || asset.ltv === null) {
    errors.push('LTV is required');
  } else {
    const ltv = parseFloat(asset.ltv);
    if (isNaN(ltv) || ltv < 0 || ltv > 1) {
      errors.push('LTV must be between 0 and 1 (0-100%)');
    }
  }

  // Required: Liquidation Threshold
  if (asset.liquidationThreshold === undefined || asset.liquidationThreshold === null) {
    errors.push('Liquidation Threshold is required');
  } else {
    const liqThreshold = parseFloat(asset.liquidationThreshold);
    const ltv = parseFloat(asset.ltv || '0');
    if (isNaN(liqThreshold) || liqThreshold < 0 || liqThreshold > 1) {
      errors.push('Liquidation Threshold must be between 0 and 1 (0-100%)');
    } else if (liqThreshold <= ltv) {
      errors.push('Liquidation Threshold must be higher than LTV');
    }
  }

  // Optional: Supply APY (can be negative for incentivized supply)
  if (asset.liquidityRate !== undefined && asset.liquidityRate !== null && asset.liquidityRate !== '') {
    const rate = parseFloat(asset.liquidityRate);
    if (isNaN(rate) || rate < -10 || rate > 10) {
      errors.push('Supply APY must be between -10 and 10 (-1000% to 1000%)');
    }
  }

  // Optional: Borrow APY (can be negative for borrowing incentives)
  if (asset.variableBorrowRate !== undefined && asset.variableBorrowRate !== null && asset.variableBorrowRate !== '') {
    const rate = parseFloat(asset.variableBorrowRate);
    if (isNaN(rate) || rate < -10 || rate > 10) {
      errors.push('Borrow APY must be between -10 and 10 (-1000% to 1000%)');
    }
  }

  // Optional: Address format
  if (asset.address && !/^0x[a-fA-F0-9]{40}$/.test(asset.address)) {
    errors.push('Invalid Ethereum address format. Must be 0x followed by 40 hex characters');
  }

  // Optional: Decimals
  if (asset.decimals !== undefined && asset.decimals !== null) {
    const decimals = parseInt(asset.decimals.toString());
    if (isNaN(decimals) || decimals < 0 || decimals > 18) {
      errors.push('Decimals must be between 0 and 18');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Save a new custom asset
 */
export function saveCustomAsset(
  asset: Omit<CustomAsset, 'id' | 'createdAt' | 'updatedAt'>
): CustomAsset {
  const validation = validateCustomAsset(asset);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const storage = getStorageData();

  if (storage.assets.length >= MAX_CUSTOM_ASSETS) {
    throw new Error(`Maximum of ${MAX_CUSTOM_ASSETS} custom assets reached. Please delete some assets.`);
  }

  const now = Date.now();
  const newAsset: CustomAsset = {
    ...asset,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  storage.assets.push(newAsset);
  saveStorageData(storage);

  console.log(`✅ Custom asset saved: ${newAsset.symbol}`);
  return newAsset;
}

/**
 * Update an existing custom asset
 */
export function updateCustomAsset(id: string, updates: Partial<Omit<CustomAsset, 'id' | 'createdAt'>>): CustomAsset {
  const storage = getStorageData();
  const index = storage.assets.findIndex((a) => a.id === id);

  if (index === -1) {
    throw new Error(`Custom asset with id ${id} not found`);
  }

  const existing = storage.assets[index];
  const updated: CustomAsset = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };

  const validation = validateCustomAsset(updated);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  storage.assets[index] = updated;
  saveStorageData(storage);

  console.log(`✅ Custom asset updated: ${updated.symbol}`);
  return updated;
}

/**
 * Delete a custom asset
 */
export function deleteCustomAsset(id: string): void {
  const storage = getStorageData();
  const index = storage.assets.findIndex((a) => a.id === id);

  if (index === -1) {
    throw new Error(`Custom asset with id ${id} not found`);
  }

  const asset = storage.assets[index];
  storage.assets.splice(index, 1);
  saveStorageData(storage);

  console.log(`✅ Custom asset deleted: ${asset.symbol}`);
}

/**
 * Get all custom assets
 */
export function getCustomAssets(): CustomAsset[] {
  const storage = getStorageData();
  return storage.assets.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get a custom asset by symbol
 */
export function getCustomAssetBySymbol(symbol: string): CustomAsset | undefined {
  const storage = getStorageData();
  return storage.assets.find((a) => a.symbol === symbol);
}

/**
 * Get a custom asset by id
 */
export function getCustomAssetById(id: string): CustomAsset | undefined {
  const storage = getStorageData();
  return storage.assets.find((a) => a.id === id);
}

/**
 * Check if a symbol has a custom asset
 */
export function hasCustomAsset(symbol: string): boolean {
  return getCustomAssetBySymbol(symbol) !== undefined;
}

/**
 * Check if a symbol has an override (not a custom asset)
 */
export function hasCustomOverride(symbol: string): boolean {
  const asset = getCustomAssetBySymbol(symbol);
  return asset?.type === 'override';
}

/**
 * Clear all custom assets (development/testing only)
 */
export function clearAllCustomAssets(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  console.log('✅ All custom assets cleared');
}
