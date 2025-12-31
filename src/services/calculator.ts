import { RecursiveSimulation, RoundProgress, RiskMetrics } from '@/types/aave';
import { getReserveData } from './aaveService';

interface CalculationInput {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: number;
  targetHealthFactor: number;
  borrowPercentage: number; // 0.5 to 1.0 (50% to 100% of max borrow)
  mode: 'cycles' | 'healthFactor';
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

  // Calculate annual interest (for reference)
  const annualSupplyInterest = totalCollateral * supplyAPY;
  const annualBorrowInterest = totalDebt * borrowAPY;
  const netAnnualInterest = annualSupplyInterest - annualBorrowInterest;

  // Calculate risk metrics
  const riskMetrics = calculateRiskMetrics(
    totalCollateral,
    totalDebt,
    liquidationThreshold
  );

  return {
    cycles: actualCycles,
    initialAmount: initialAmountNum.toFixed(2),
    finalAmount: totalCollateral.toFixed(2),
    totalBorrowed: totalDebt.toFixed(2),
    totalInterestEarned: netAnnualInterest.toFixed(2), // Net annual interest
    leverage: leverage.toFixed(2),
    supplyAPY: (supplyAPY * 100).toFixed(2),
    borrowAPY: (borrowAPY * 100).toFixed(2),
    netAPY: ((netAnnualInterest / initialAmountNum) * 100).toFixed(2),
    riskMetrics,
    progressionByRound,
  };
}

function calculateRiskMetrics(
  totalCollateral: number,
  totalDebt: number,
  liquidationThreshold: number
): RiskMetrics {
  // Health Factor = (Collateral * LT) / Debt
  const healthFactor = totalDebt > 0
    ? (totalCollateral * liquidationThreshold) / totalDebt
    : Infinity;

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
