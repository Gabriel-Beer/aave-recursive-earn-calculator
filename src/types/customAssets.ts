/**
 * Custom Asset Types
 * Supports both new cryptocurrencies and promotional rate overrides
 */

export interface CustomAsset {
  // Identity
  id: string; // UUID
  type: 'custom' | 'override';

  // Asset Information
  symbol: string; // "NEWCOIN" or "USDC" (for override)
  name: string; // "New Awesome Coin"
  category?: string; // "Stablecoin", "Major", "LSD", "Governance", "Other"

  // Blockchain (optional)
  address?: string; // ERC20 contract address
  decimals?: number; // Token decimals (default 18)

  // Interest Rates (optional for custom, will use defaults if not provided)
  liquidityRate?: string; // Supply APY as decimal: "0.08" = 8%
  variableBorrowRate?: string; // Borrow APY as decimal: "0.05" = 5%
  stableBorrowRate?: string; // Stable rate APY as decimal

  // Risk Parameters (required)
  ltv: string; // Loan-to-Value: "0.75" = 75%, stored as decimal
  liquidationThreshold: string; // Must be > ltv: "0.80" = 80%
  liquidationBonus?: string; // Liquidation bonus: "0.05" = 5%

  // Metadata
  notes?: string; // User notes (e.g., "Promo until Jan 2025")
  createdAt: number; // Timestamp in ms
  updatedAt: number; // Timestamp in ms
}

export interface CustomAssetsStorage {
  version: number; // Schema version for migrations
  assets: CustomAsset[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
