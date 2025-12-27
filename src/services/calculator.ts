import { RecursiveSimulation, RoundProgress, RiskMetrics } from '@/types/aave';
import { getReserveData, calculateHealthFactor, calculateMaxBorrowAmount } from './aaveService';

interface CalculationInput {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: number;
  targetHealthFactor: number;
}

export async function calculateRecursiveCycles(input: CalculationInput): Promise<RecursiveSimulation> {
  const { initialAmount, assetSymbol, numberOfCycles, targetHealthFactor } = input;

  // Fetch reserve data
  const reserveData = await getReserveData(assetSymbol);

  const initialAmountNum = parseFloat(initialAmount);
  const liquidityRate = parseFloat(reserveData.liquidityRate);
  const ltv = parseFloat(reserveData.ltv);
  const liquidationThreshold = parseFloat(reserveData.liquidationThreshold);
  const variableBorrowRate = parseFloat(reserveData.variableBorrowRate);

  let currentCollateral = initialAmountNum;
  let totalBorrowed = 0;
  let totalInterestEarned = 0;
  const progressionByRound: RoundProgress[] = [];

  // Simulate recursive cycles
  for (let i = 1; i <= numberOfCycles; i++) {
    // Calculate max borrow amount based on collateral and LTV
    const maxBorrow = currentCollateral * ltv;

    // Adjust borrow amount to maintain target health factor
    // Health Factor = (Collateral * Liquidation Threshold) / Total Borrows
    // We need: HF >= targetHealthFactor
    const adjustedBorrowAmount = Math.min(
      maxBorrow,
      (currentCollateral * liquidationThreshold) / targetHealthFactor
    );

    // Calculate interest for this cycle
    const interestForCycle = currentCollateral * liquidityRate;
    totalInterestEarned += interestForCycle;

    // Re-deposit: new collateral = old collateral + borrowed + interest
    const newCollateral = currentCollateral + adjustedBorrowAmount + interestForCycle;

    // Track total borrowed
    totalBorrowed += adjustedBorrowAmount;

    // Calculate health factor for this round
    const hf = await calculateHealthFactor(
      newCollateral.toString(),
      (totalBorrowed + adjustedBorrowAmount).toString(),
      liquidationThreshold.toString()
    );

    progressionByRound.push({
      round: i,
      collateralAmount: currentCollateral.toFixed(2),
      borrowAmount: adjustedBorrowAmount.toFixed(2),
      healthFactor: hf,
      cumulativeInterest: totalInterestEarned.toFixed(2),
    });

    currentCollateral = newCollateral;
  }

  // Calculate final metrics
  const finalAmount = currentCollateral;
  const riskMetrics = calculateRiskMetrics(
    finalAmount,
    totalBorrowed,
    liquidationThreshold,
    targetHealthFactor
  );

  return {
    cycles: numberOfCycles,
    initialAmount: initialAmountNum.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    totalBorrowed: totalBorrowed.toFixed(2),
    totalInterestEarned: totalInterestEarned.toFixed(2),
    riskMetrics,
    progressionByRound,
  };
}

function calculateRiskMetrics(
  totalCollateral: number,
  totalBorrows: number,
  liquidationThreshold: number,
  targetHealthFactor: number
): RiskMetrics {
  const healthFactor = totalBorrows > 0 ? (totalCollateral * liquidationThreshold) / totalBorrows : Infinity;

  // Estimate liquidation price (assuming 1:1 collateral to USD)
  const liquidationPrice = totalBorrows > 0 ? totalBorrows / (liquidationThreshold) : 0;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  const warningMessages: string[] = [];

  if (healthFactor < 1.05) {
    riskLevel = 'CRITICAL';
    warningMessages.push('⚠️ DANGER: Health factor approaching 1.0 - liquidation imminent!');
    warningMessages.push('Réduisez immédiatement vos emprunts ou augmentez le collateral');
  } else if (healthFactor < 1.5) {
    riskLevel = 'HIGH';
    warningMessages.push('⚠️ WARNING: Health factor très faible - risque élevé de liquidation');
    warningMessages.push('Envisagez de réduire votre exposition');
  } else if (healthFactor < 2.0) {
    riskLevel = 'MEDIUM';
    warningMessages.push('ℹ️ Votre santé financière est modérée - soyez vigilant aux variations de prix');
  } else if (healthFactor < 3.0) {
    riskLevel = 'LOW';
    warningMessages.push('✓ Profil de risque sain');
  } else {
    riskLevel = 'LOW';
    warningMessages.push('✓ Profil de risque très conservateur');
  }

  return {
    healthFactor: typeof healthFactor === 'number' && isFinite(healthFactor)
      ? healthFactor.toFixed(2)
      : 'N/A',
    liquidationPrice: liquidationPrice.toFixed(2),
    riskLevel,
    warningMessages,
  };
}
