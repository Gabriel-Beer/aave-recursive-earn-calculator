import { RecursiveSimulation } from '@/types/aave';

/**
 * Calculate compound interest for a given time period
 * Formula: A = P * (1 + r/n)^(n*t)
 */
function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  periodsPerYear: number,
  timeYears: number
): number {
  if (periodsPerYear === 0) {
    return principal * annualRate * timeYears;
  }
  const ratePerPeriod = annualRate / periodsPerYear;
  const totalPeriods = periodsPerYear * timeYears;
  const finalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods);
  return finalAmount - principal;
}

/**
 * Calculate net interest with compounding
 */
function calculateNetCompoundInterest(
  totalCollateral: number,
  totalDebt: number,
  supplyAPY: number,
  borrowAPY: number,
  periodsPerYear: number,
  timeYears: number
): number {
  const supplyInterest = calculateCompoundInterest(
    totalCollateral,
    supplyAPY,
    periodsPerYear,
    timeYears
  );

  const borrowInterest = calculateCompoundInterest(
    totalDebt,
    borrowAPY,
    periodsPerYear,
    timeYears
  );

  return supplyInterest - borrowInterest;
}

/**
 * Generate time-series data for compound interest visualization
 * Shows how money grows over time with simple vs compound interest
 */
export interface TimeSeriesDataPoint {
  month: number;
  time: string; // e.g., "1 month", "3 months", "1 year"
  simpleInterest: number;
  compoundInterest: number;
  difference: number;
  totalWithSimple: number;
  totalWithCompound: number;
}

export function generateCompoundGrowthChart(results: RecursiveSimulation): TimeSeriesDataPoint[] {
  const initialAmount = parseFloat(results.initialAmount);
  const totalCollateral = parseFloat(results.finalAmount);
  const totalDebt = parseFloat(results.totalBorrowed);
  const supplyAPY = parseFloat(results.supplyAPY) / 100;
  const borrowAPY = parseFloat(results.borrowAPY) / 100;
  const periodsPerYear = results.compoundingConfig.periodsPerYear;

  // Calculate annual net interest for simple interest baseline
  const annualSimple = totalCollateral * supplyAPY - totalDebt * borrowAPY;

  const timePoints = [
    { months: 1, label: '1 mois' },
    { months: 3, label: '3 mois' },
    { months: 6, label: '6 mois' },
    { months: 12, label: '1 an' },
    { months: 24, label: '2 ans' },
    { months: 36, label: '3 ans' },
    { months: 48, label: '4 ans' },
    { months: 60, label: '5 ans' },
  ];

  return timePoints.map((point) => {
    const timeYears = point.months / 12;

    // Simple interest (linear)
    const simpleInterest = annualSimple * timeYears;

    // Compound interest
    const compoundInterest = calculateNetCompoundInterest(
      totalCollateral,
      totalDebt,
      supplyAPY,
      borrowAPY,
      periodsPerYear,
      timeYears
    );

    return {
      month: point.months,
      time: point.label,
      simpleInterest: simpleInterest,
      compoundInterest: compoundInterest,
      difference: compoundInterest - simpleInterest,
      totalWithSimple: initialAmount + simpleInterest,
      totalWithCompound: initialAmount + compoundInterest,
    };
  });
}

/**
 * Generate data for position value evolution chart
 * Shows collateral, debt, and net position over time
 */
export interface PositionEvolutionPoint {
  cycle: string;
  collateral: number;
  debt: number;
  netPosition: number;
  leverage: number;
}

export function generatePositionEvolutionChart(results: RecursiveSimulation): PositionEvolutionPoint[] {
  return results.progressionByRound.map((round) => ({
    cycle: `Cycle ${round.round}`,
    collateral: parseFloat(round.collateralAmount),
    debt: parseFloat(round.borrowAmount),
    netPosition: parseFloat(round.collateralAmount) - parseFloat(round.borrowAmount),
    leverage: parseFloat(round.collateralAmount) / parseFloat(results.initialAmount),
  }));
}

/**
 * Generate cumulative interest earned over cycles
 */
export interface InterestEarnedPoint {
  cycle: string;
  interestEarned: number;
  cumulativeInterest: number;
}

export function generateInterestEarnedChart(results: RecursiveSimulation): InterestEarnedPoint[] {
  let cumulativeInterest = 0;

  return results.progressionByRound.map((round, index) => {
    // Estimate interest earned in this cycle
    // For simplicity, we'll distribute the total interest equally
    const interestPerCycle = parseFloat(results.totalInterestEarned) / results.progressionByRound.length;
    cumulativeInterest += interestPerCycle;

    return {
      cycle: `Cycle ${round.round}`,
      interestEarned: interestPerCycle,
      cumulativeInterest: cumulativeInterest,
    };
  });
}

/**
 * Generate monthly projection data for detailed time-based visualization
 */
export interface MonthlyProjectionPoint {
  month: number;
  time: string;
  principal: number;
  interestAccumulated: number;
  totalValue: number;
}

export function generateMonthlyProjections(
  results: RecursiveSimulation,
  monthsToProject: number = 60
): MonthlyProjectionPoint[] {
  const initialAmount = parseFloat(results.initialAmount);
  const totalCollateral = parseFloat(results.finalAmount);
  const totalDebt = parseFloat(results.totalBorrowed);
  const supplyAPY = parseFloat(results.supplyAPY) / 100;
  const borrowAPY = parseFloat(results.borrowAPY) / 100;

  const periodsPerYear = results.compoundingConfig.periodsPerYear;
  const isCompounding = results.compoundingConfig.enabled;

  // Annual simple interest for baseline
  const annualSimple = totalCollateral * supplyAPY - totalDebt * borrowAPY;

  const data: MonthlyProjectionPoint[] = [];

  for (let month = 0; month <= monthsToProject; month += 3) {
    const years = month / 12;
    let interestAccumulated = 0;

    if (isCompounding && periodsPerYear > 0) {
      // Use the same compounding formula as the chart
      interestAccumulated = calculateNetCompoundInterest(
        totalCollateral,
        totalDebt,
        supplyAPY,
        borrowAPY,
        periodsPerYear,
        years
      );
    } else {
      // Simple interest
      interestAccumulated = annualSimple * years;
    }

    data.push({
      month: month,
      time: month === 0 ? 'Aujourd\'hui' : `${month} mois`,
      principal: initialAmount,
      interestAccumulated: interestAccumulated,
      totalValue: initialAmount + interestAccumulated,
    });
  }

  return data;
}
