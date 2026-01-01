import { RecursiveSimulation, RoundProgress, RiskMetrics } from '@/types/aave';
import { getReserveData } from './aaveService';

interface CalculationInput {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: number;
  targetHealthFactor: number;
  borrowPercentage: number; // 0.5 to 1.0 (50% to 100% of max borrow)
  mode: 'cycles' | 'healthFactor';
  autoReinvest?: 'true' | 'false';
  harvestFrequencyType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  customHarvestDays?: string;
}

interface CompoundingConfig {
  enabled: boolean;
  periodsPerYear: number; // 365 (daily), 52 (weekly), 12 (monthly), 4 (quarterly), or custom
}

/**
 * Calculate compound interest for a given time period
 * Formula: A = P * (1 + r/n)^(n*t)
 * Where:
 *   P = principal (initial collateral/debt)
 *   r = annual rate (APY)
 *   n = compounding periods per year
 *   t = time in years
 */
function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  periodsPerYear: number,
  timeYears: number
): number {
  if (periodsPerYear === 0) {
    // Simple interest fallback
    return principal * annualRate * timeYears;
  }

  const ratePerPeriod = annualRate / periodsPerYear;
  const totalPeriods = periodsPerYear * timeYears;
  const finalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods);
  return finalAmount - principal; // Return just the interest earned
}

/**
 * Calculate net interest with compounding
 */
function calculateNetCompoundInterest(
  totalCollateral: number,
  totalDebt: number,
  supplyAPY: number,
  borrowAPY: number,
  compounding: CompoundingConfig,
  timeYears: number
): number {
  if (!compounding.enabled) {
    // Simple interest (current behavior)
    const annualSupply = totalCollateral * supplyAPY;
    const annualBorrow = totalDebt * borrowAPY;
    return (annualSupply - annualBorrow) * timeYears;
  }

  // Compound interest
  const supplyInterest = calculateCompoundInterest(
    totalCollateral,
    supplyAPY,
    compounding.periodsPerYear,
    timeYears
  );

  const borrowInterest = calculateCompoundInterest(
    totalDebt,
    borrowAPY,
    compounding.periodsPerYear,
    timeYears
  );

  return supplyInterest - borrowInterest;
}

/**
 * Get periods per year based on harvest frequency type
 */
function getPeriodsPerYear(type?: string, customDays?: string): number {
  switch (type) {
    case 'daily':
      return 365;
    case 'weekly':
      return 52;
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'custom':
      return Math.floor(365 / parseInt(customDays || '30'));
    default:
      return 12;
  }
}

/**
 * Get human-readable frequency label
 */
function getFrequencyLabel(type?: string, customDays?: string): string {
  switch (type) {
    case 'daily':
      return 'Quotidien';
    case 'weekly':
      return 'Hebdomadaire';
    case 'monthly':
      return 'Mensuel';
    case 'quarterly':
      return 'Trimestriel';
    case 'custom':
      return `Tous les ${customDays} jours`;
    default:
      return 'Mensuel';
  }
}

/**
 * Calculates the recursive lending simulation
 *
 * How it works:
 * 1. Deposit initial amount as collateral
 * 2. Borrow (collateral * LTV * borrowPercentage)
 * 3. Re-deposit borrowed amount as new collateral
 * 4. Repeat until target cycles or health factor is reached
 *
 * Health Factor = (Total Collateral * Liquidation Threshold) / Total Debt
 */
export async function calculateRecursiveCycles(input: CalculationInput): Promise<RecursiveSimulation> {
  const { initialAmount, assetSymbol, numberOfCycles, targetHealthFactor, borrowPercentage, mode } = input;

  // Fetch reserve data from Aave
  const reserveData = await getReserveData(assetSymbol);

  const initialAmountNum = parseFloat(initialAmount);
  const ltv = parseFloat(reserveData.ltv); // e.g., 0.80 = 80%
  const liquidationThreshold = parseFloat(reserveData.liquidationThreshold); // e.g., 0.85 = 85%
  const supplyAPY = parseFloat(reserveData.liquidityRate); // Annual supply rate (decimal, e.g., 0.4386 = 43.86%)
  const borrowAPY = parseFloat(reserveData.variableBorrowRate); // Annual borrow rate (decimal)

  // Calculate maximum theoretical leverage
  // Formula: maxLeverage = 1 / (1 - LTV)
  // Example: LTV 77% → maxLeverage = 1 / (1 - 0.77) = 4.35x
  const maxTheoreticalLeverage = 1 / (1 - ltv);

  // Effective borrow ratio per cycle (borrowPercentage is already in decimal, e.g., 0.72 = 72% of collateral)
  // This is directly the percentage of collateral to borrow, capped at LTV
  const effectiveLTV = borrowPercentage;

  let totalCollateral = initialAmountNum;
  let totalDebt = 0;
  const progressionByRound: RoundProgress[] = [];

  // Maximum cycles to prevent infinite loops
  const maxCycles = mode === 'cycles' ? numberOfCycles : 50;
  let actualCycles = 0;

  // Amount available to borrow from (starts with initial deposit)
  let collateralFromLastCycle = initialAmountNum;

  for (let i = 1; i <= maxCycles; i++) {
    // Calculate how much we can borrow based on the NEW collateral from last cycle
    const borrowAmount = collateralFromLastCycle * effectiveLTV;

    // Skip if borrow amount is too small (< 1% of initial)
    if (borrowAmount < initialAmountNum * 0.01) {
      break;
    }

    // Add borrowed amount to total debt
    totalDebt += borrowAmount;

    // Re-deposit borrowed amount as collateral
    totalCollateral += borrowAmount;

    // Calculate current health factor
    const currentHF = (totalCollateral * liquidationThreshold) / totalDebt;

    // Record this round
    progressionByRound.push({
      round: i,
      collateralAmount: totalCollateral.toFixed(2),
      borrowAmount: borrowAmount.toFixed(2),
      healthFactor: currentHF.toFixed(2),
      cumulativeInterest: '0', // We'll calculate this separately
    });

    actualCycles = i;

    // In health factor mode, stop when we reach target
    if (mode === 'healthFactor' && currentHF <= targetHealthFactor) {
      break;
    }

    // Prepare for next cycle - only the newly deposited amount can generate new borrows
    collateralFromLastCycle = borrowAmount;
  }

  // Calculate leverage
  const leverage = totalCollateral / initialAmountNum;

  // Calculate Net APY using official Aave formula
  // Formula: netAPY = (supplyAPY × leverage) - (borrowAPY × (leverage - 1))
  // This accounts for earning on total collateral and paying interest on net debt
  const netAPYDecimal = (supplyAPY * leverage) - (borrowAPY * (leverage - 1));
  const netAPYPercent = netAPYDecimal * 100;

  // Calculate annual interest (for reference)
  const annualSupplyInterest = totalCollateral * supplyAPY;
  const annualBorrowInterest = totalDebt * borrowAPY;
  const netAnnualInterest = annualSupplyInterest - annualBorrowInterest;

  // Parse compounding config
  const compoundingConfig: CompoundingConfig = {
    enabled: input.autoReinvest === 'true',
    periodsPerYear: getPeriodsPerYear(input.harvestFrequencyType, input.customHarvestDays),
  };

  // Calculate time projections with compound interest
  const timeProjections = [
    { period: '1 mois', months: 1 },
    { period: '3 mois', months: 3 },
    { period: '6 mois', months: 6 },
    { period: '1 an', months: 12 },
    { period: '2 ans', months: 24 },
  ].map(({ period, months }) => {
    const timeYears = months / 12;

    const interestSimple = (annualSupplyInterest - annualBorrowInterest) * timeYears;
    const interestCompound = calculateNetCompoundInterest(
      totalCollateral,
      totalDebt,
      supplyAPY,
      borrowAPY,
      compoundingConfig,
      timeYears
    );

    return {
      period,
      months,
      interestSimple: interestSimple.toFixed(2),
      interestCompound: interestCompound.toFixed(2),
      totalValueCompound: (totalCollateral + interestCompound - totalDebt).toFixed(2),
    };
  });

  // Calculate risk metrics
  const riskMetrics = calculateRiskMetrics(
    totalCollateral,
    totalDebt,
    liquidationThreshold,
    maxTheoreticalLeverage,
    initialAmountNum
  );

  return {
    cycles: actualCycles,
    initialAmount: initialAmountNum.toFixed(2),
    finalAmount: totalCollateral.toFixed(2),
    totalBorrowed: totalDebt.toFixed(2),
    totalInterestEarned: netAnnualInterest.toFixed(2), // Net annual interest
    leverage: leverage.toFixed(2),
    maxLeverage: maxTheoreticalLeverage.toFixed(2),
    supplyAPY: (supplyAPY * 100).toFixed(2),
    borrowAPY: (borrowAPY * 100).toFixed(2),
    netAPY: netAPYPercent.toFixed(2),
    riskMetrics,
    progressionByRound,
    compoundingConfig: {
      enabled: compoundingConfig.enabled,
      periodsPerYear: compoundingConfig.periodsPerYear,
      frequencyLabel: getFrequencyLabel(input.harvestFrequencyType, input.customHarvestDays),
    },
    timeProjections,
  };
}

function calculateRiskMetrics(
  totalCollateral: number,
  totalDebt: number,
  liquidationThreshold: number,
  maxTheoreticalLeverage: number,
  initialAmount: number
): RiskMetrics {
  // Health Factor = (Collateral * LT) / Debt
  const healthFactor = totalDebt > 0
    ? (totalCollateral * liquidationThreshold) / totalDebt
    : Infinity;

  // Current leverage = totalCollateral / initialAmount
  const currentLeverage = initialAmount > 0 ? totalCollateral / initialAmount : 1;

  // Liquidation price: at what % drop does HF = 1?
  // HF = (Collateral * priceDrop * LT) / Debt = 1
  // priceDrop = Debt / (Collateral * LT)
  const liquidationPriceRatio = totalDebt > 0
    ? totalDebt / (totalCollateral * liquidationThreshold)
    : 0;

  // Max drop before liquidation (e.g., 0.7 means price can drop 30%)
  const maxPriceDropPercent = ((1 - liquidationPriceRatio) * 100);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  const warningMessages: string[] = [];

  // Check if leverage exceeds theoretical maximum
  if (currentLeverage > maxTheoreticalLeverage * 0.95) {
    warningMessages.push(`⚠️ Leverage très proche du max théorique (${currentLeverage.toFixed(2)}x / ${maxTheoreticalLeverage.toFixed(2)}x)`);
    warningMessages.push('Toute augmentation de l\'utilisation pourrait causer une liquidation');
  }

  if (healthFactor < 1.1) {
    riskLevel = 'CRITICAL';
    warningMessages.push('⚠️ DANGER: Health Factor < 1.1 - Liquidation imminente!');
    warningMessages.push(`Le prix peut chuter de seulement ${maxPriceDropPercent.toFixed(1)}% avant liquidation`);
  } else if (healthFactor < 1.3) {
    riskLevel = 'HIGH';
    warningMessages.push('⚠️ Risque élevé - Health Factor bas');
    warningMessages.push(`Marge avant liquidation: ${maxPriceDropPercent.toFixed(1)}%`);
  } else if (healthFactor < 1.5) {
    riskLevel = 'MEDIUM';
    warningMessages.push('⚡ Risque modéré - Surveillez les variations de prix');
    warningMessages.push(`Marge avant liquidation: ${maxPriceDropPercent.toFixed(1)}%`);
  } else if (healthFactor < 2.0) {
    riskLevel = 'LOW';
    warningMessages.push('✓ Position relativement sûre');
    warningMessages.push(`Marge avant liquidation: ${maxPriceDropPercent.toFixed(1)}%`);
  } else {
    riskLevel = 'LOW';
    warningMessages.push('✓ Position très conservatrice');
    warningMessages.push(`Marge avant liquidation: ${maxPriceDropPercent.toFixed(1)}%`);
  }

  return {
    healthFactor: isFinite(healthFactor) ? healthFactor.toFixed(2) : '∞',
    liquidationPrice: liquidationPriceRatio.toFixed(4),
    maxPriceDropPercent: maxPriceDropPercent.toFixed(1),
    riskLevel,
    warningMessages,
  };
}
