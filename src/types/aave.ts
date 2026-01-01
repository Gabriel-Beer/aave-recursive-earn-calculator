export interface ReserveData {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  totalLiquidity: string;
  utilizationRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  liquidityRate: string;
  reserveFactor: string;
  ltv: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  lastUpdateTimestamp: number;
}

export interface UserAccountData {
  totalCollateralBase: string;
  totalBorrowsBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface TimeProjection {
  period: string;
  months: number;
  interestSimple: string;
  interestCompound: string;
  totalValueCompound: string;
}

export interface CompoundingConfig {
  enabled: boolean;
  periodsPerYear: number;
  frequencyLabel: string;
}

export interface RecursiveSimulation {
  cycles: number;
  initialAmount: string;
  finalAmount: string;
  totalBorrowed: string;
  totalInterestEarned: string;
  leverage: string;
  maxLeverage: string; // Theoretical maximum leverage (1 / (1 - LTV))
  supplyAPY: string;
  borrowAPY: string;
  netAPY: string;
  riskMetrics: RiskMetrics;
  progressionByRound: RoundProgress[];
  compoundingConfig: CompoundingConfig;
  timeProjections: TimeProjection[];
}

export interface RiskMetrics {
  healthFactor: string;
  liquidationPrice: string;
  maxPriceDropPercent: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warningMessages: string[];
}

export interface RoundProgress {
  round: number;
  collateralAmount: string;
  borrowAmount: string;
  healthFactor: string;
  cumulativeInterest: string;
}
