import { RecursiveSimulation, RoundProgress, RiskMetrics } from '@/types/aave';
import { getReserveData, calculateHealthFactor } from './aaveService';

interface CalculationInput {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: number;
  targetHealthFactor: number;
  borrowPercentage: number; // 0.5 to 1.0 (50% to 100% of max borrow)
  mode: 'cycles' | 'healthFactor';
}

export async function calculateRecursiveCycles(input: CalculationInput): Promise<RecursiveSimulation> {
  const { initialAmount, assetSymbol, numberOfCycles, targetHealthFactor, borrowPercentage, mode } = input;

  // Fetch reserve data
  const reserveData = await getReserveData(assetSymbol);

  const initialAmountNum = parseFloat(initialAmount);
  const liquidityRate = parseFloat(reserveData.liquidityRate);
  const ltv = parseFloat(reserveData.ltv);
  const liquidationThreshold = parseFloat(reserveData.liquidationThreshold);

  let currentCollateral = initialAmountNum;
  let totalBorrowed = 0;
  let totalInterestEarned = 0;
  const progressionByRound: RoundProgress[] = [];

  // Determine max cycles based on mode
  const maxCycles = mode === 'cycles' ? numberOfCycles : 20; // Max 20 cycles in HF mode
  let actualCycles = 0;

  // Simulate recursive cycles
  for (let i = 1; i <= maxCycles; i++) {
    // Calculate max borrow amount based on collateral and LTV
    // Apply borrowPercentage to limit exposure (protection contre depeg)
    const maxBorrow = currentCollateral * ltv * borrowPercentage;

    // Calculate what we would borrow this cycle
    let borrowAmountThisCycle = maxBorrow;

    // In health factor mode, check if we've reached target HF
    if (mode === 'healthFactor') {
      // Calculate what the health factor would be if we borrow this amount
      const potentialTotalBorrowed = totalBorrowed + borrowAmountThisCycle;
      const potentialCollateral = currentCollateral + borrowAmountThisCycle;
      const potentialHF = (potentialCollateral * liquidationThreshold) / potentialTotalBorrowed;

      // If we would go below target HF, reduce borrow amount or stop
      if (potentialHF < targetHealthFactor) {
        // Calculate exact amount to borrow to reach target HF
        // HF = (collateral + borrow) * LT / (totalBorrowed + borrow)
        // HF * (totalBorrowed + borrow) = (collateral + borrow) * LT
        // HF * totalBorrowed + HF * borrow = collateral * LT + borrow * LT
        // HF * borrow - borrow * LT = collateral * LT - HF * totalBorrowed
        // borrow * (HF - LT) = collateral * LT - HF * totalBorrowed
        // borrow = (collateral * LT - HF * totalBorrowed) / (HF - LT)

        if (targetHealthFactor > liquidationThreshold) {
          borrowAmountThisCycle = (currentCollateral * liquidationThreshold - targetHealthFactor * totalBorrowed) / (targetHealthFactor - liquidationThreshold);
          borrowAmountThisCycle = Math.max(0, Math.min(borrowAmountThisCycle, maxBorrow));
        } else {
          borrowAmountThisCycle = 0;
        }

        // If we can't borrow enough to make a difference, stop
        if (borrowAmountThisCycle < initialAmountNum * 0.01) {
          break;
        }
      }
    }

    // Skip if nothing to borrow
    if (borrowAmountThisCycle <= 0) {
      break;
    }

    // Calculate interest for this cycle
    const interestForCycle = currentCollateral * liquidityRate;
    totalInterestEarned += interestForCycle;

    // Re-deposit: new collateral = old collateral + borrowed + interest
    const newCollateral = currentCollateral + borrowAmountThisCycle + interestForCycle;

    // Track total borrowed
    totalBorrowed += borrowAmountThisCycle;
    actualCycles = i;

    // Calculate health factor for this round
    const hf = await calculateHealthFactor(
      newCollateral.toString(),
      totalBorrowed.toString(),
      liquidationThreshold.toString()
    );

    progressionByRound.push({
      round: i,
      collateralAmount: currentCollateral.toFixed(2),
      borrowAmount: borrowAmountThisCycle.toFixed(2),
      healthFactor: hf,
      cumulativeInterest: totalInterestEarned.toFixed(2),
    });

    currentCollateral = newCollateral;

    // In health factor mode, check if we've reached target
    if (mode === 'healthFactor') {
      const currentHF = parseFloat(hf);
      if (currentHF <= targetHealthFactor * 1.05) {
        break; // Close enough to target
      }
    }
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
    cycles: actualCycles,
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
