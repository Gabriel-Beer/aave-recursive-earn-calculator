import { ReserveData, UserAccountData } from '@/types/aave';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

// AAVE V3 Pool Data Provider Address on Ethereum Mainnet
const AAVE_POOL_DATA_PROVIDER = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3';

// AAVE V3 Pool Address on Ethereum Mainnet
const AAVE_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

// Create a public client for read-only operations
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'),
});

// Pool Data Provider ABI (for getReserveData and getReserveConfigurationData)
const POOL_DATA_PROVIDER_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { internalType: 'uint256', name: 'unbacked', type: 'uint256' },
      { internalType: 'uint256', name: 'accruedToTreasuryScaled', type: 'uint256' },
      { internalType: 'uint256', name: 'totalAToken', type: 'uint256' },
      { internalType: 'uint256', name: 'totalStableDebt', type: 'uint256' },
      { internalType: 'uint256', name: 'totalVariableDebt', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidityRate', type: 'uint256' },
      { internalType: 'uint256', name: 'variableBorrowRate', type: 'uint256' },
      { internalType: 'uint256', name: 'stableBorrowRate', type: 'uint256' },
      { internalType: 'uint256', name: 'averageStableBorrowRate', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidityIndex', type: 'uint256' },
      { internalType: 'uint256', name: 'variableBorrowIndex', type: 'uint256' },
      { internalType: 'uint40', name: 'lastUpdateTimestamp', type: 'uint40' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'getReserveConfigurationData',
    outputs: [
      { internalType: 'uint256', name: 'decimals', type: 'uint256' },
      { internalType: 'uint256', name: 'ltv', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidationThreshold', type: 'uint256' },
      { internalType: 'uint256', name: 'liquidationBonus', type: 'uint256' },
      { internalType: 'uint256', name: 'reserveFactor', type: 'uint256' },
      { internalType: 'bool', name: 'usageAsCollateralEnabled', type: 'bool' },
      { internalType: 'bool', name: 'borrowingEnabled', type: 'bool' },
      { internalType: 'bool', name: 'stableBorrowRateEnabled', type: 'bool' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
      { internalType: 'bool', name: 'isFrozen', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// AAVE V3 Pool ABI for getUserAccountData
const POOL_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { internalType: 'uint256', name: 'totalCollateralBase', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDebtBase', type: 'uint256' },
      { internalType: 'uint256', name: 'availableBorrowsBase', type: 'uint256' },
      { internalType: 'uint256', name: 'currentLiquidationThreshold', type: 'uint256' },
      { internalType: 'uint256', name: 'ltv', type: 'uint256' },
      { internalType: 'uint256', name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Asset addresses on Ethereum Mainnet
const ASSET_ADDRESSES: Record<string, `0x${string}`> = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH is used for ETH in AAVE
};

// Asset metadata
const ASSET_METADATA: Record<string, { id: string; name: string }> = {
  USDC: { id: '1', name: 'USD Coin' },
  DAI: { id: '2', name: 'Dai Stablecoin' },
  USDT: { id: '3', name: 'Tether USD' },
  WETH: { id: '4', name: 'Wrapped Ether' },
  WBTC: { id: '5', name: 'Wrapped Bitcoin' },
  ETH: { id: '4', name: 'Ethereum' },
};

// Mock data for fallback
const MOCK_RATES: Record<string, ReserveData> = {
  USDC: {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    totalLiquidity: '1000000000',
    utilizationRate: '0.65',
    variableBorrowRate: '0.045',
    stableBorrowRate: '0.050',
    liquidityRate: '0.029',
    reserveFactor: '0.10',
    ltv: '0.80',
    liquidationThreshold: '0.85',
    liquidationBonus: '0.05',
    lastUpdateTimestamp: Date.now(),
  },
  DAI: {
    id: '2',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    totalLiquidity: '500000000',
    utilizationRate: '0.72',
    variableBorrowRate: '0.048',
    stableBorrowRate: '0.052',
    liquidityRate: '0.035',
    reserveFactor: '0.10',
    ltv: '0.75',
    liquidationThreshold: '0.80',
    liquidationBonus: '0.05',
    lastUpdateTimestamp: Date.now(),
  },
  USDT: {
    id: '3',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    totalLiquidity: '800000000',
    utilizationRate: '0.68',
    variableBorrowRate: '0.044',
    stableBorrowRate: '0.049',
    liquidityRate: '0.030',
    reserveFactor: '0.10',
    ltv: '0.80',
    liquidationThreshold: '0.85',
    liquidationBonus: '0.05',
    lastUpdateTimestamp: Date.now(),
  },
  ETH: {
    id: '4',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    totalLiquidity: '500000',
    utilizationRate: '0.58',
    variableBorrowRate: '0.032',
    stableBorrowRate: '0.045',
    liquidityRate: '0.019',
    reserveFactor: '0.15',
    ltv: '0.82',
    liquidationThreshold: '0.86',
    liquidationBonus: '0.05',
    lastUpdateTimestamp: Date.now(),
  },
  WETH: {
    id: '4',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    totalLiquidity: '500000',
    utilizationRate: '0.58',
    variableBorrowRate: '0.032',
    stableBorrowRate: '0.045',
    liquidityRate: '0.019',
    reserveFactor: '0.15',
    ltv: '0.82',
    liquidationThreshold: '0.86',
    liquidationBonus: '0.05',
    lastUpdateTimestamp: Date.now(),
  },
  WBTC: {
    id: '5',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    totalLiquidity: '10000',
    utilizationRate: '0.45',
    variableBorrowRate: '0.025',
    stableBorrowRate: '0.035',
    liquidityRate: '0.011',
    reserveFactor: '0.20',
    ltv: '0.73',
    liquidationThreshold: '0.78',
    liquidationBonus: '0.10',
    lastUpdateTimestamp: Date.now(),
  },
};

// RAY = 10^27 (used for rate calculations in AAVE)
const RAY = BigInt(10 ** 27);

/**
 * Converts AAVE ray value (10^27) to a decimal percentage string
 */
function rayToPercent(rayValue: bigint): string {
  // Convert ray to percentage (divide by 10^27 to get decimal)
  const percent = Number(rayValue) / Number(RAY);
  return percent.toFixed(6);
}

/**
 * Converts basis points (e.g., 8000 = 80%) to decimal string
 */
function bpsToDecimal(bps: bigint): string {
  return (Number(bps) / 10000).toFixed(4);
}

export async function getReserveData(assetSymbol: string): Promise<ReserveData> {
  const assetAddress = ASSET_ADDRESSES[assetSymbol];
  const metadata = ASSET_METADATA[assetSymbol];

  if (!assetAddress || !metadata) {
    console.warn(`Unknown asset symbol: ${assetSymbol}, falling back to mock data`);
    return MOCK_RATES[assetSymbol] || MOCK_RATES['USDC'];
  }

  try {
    // Fetch reserve data and configuration in parallel
    const [reserveData, configData] = await Promise.all([
      publicClient.readContract({
        address: AAVE_POOL_DATA_PROVIDER,
        abi: POOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveData',
        args: [assetAddress],
      }),
      publicClient.readContract({
        address: AAVE_POOL_DATA_PROVIDER,
        abi: POOL_DATA_PROVIDER_ABI,
        functionName: 'getReserveConfigurationData',
        args: [assetAddress],
      }),
    ]);

    // Extract values from reserve data
    const [
      , // unbacked
      , // accruedToTreasuryScaled
      totalAToken,
      totalStableDebt,
      totalVariableDebt,
      liquidityRate,
      variableBorrowRate,
      stableBorrowRate,
      , // averageStableBorrowRate
      , // liquidityIndex
      , // variableBorrowIndex
      lastUpdateTimestamp,
    ] = reserveData;

    // Extract values from configuration data
    const [
      decimals,
      ltv,
      liquidationThreshold,
      liquidationBonus,
      reserveFactor,
    ] = configData;

    // Calculate total liquidity (totalAToken represents total supplied)
    const totalLiquidity = totalAToken;
    const totalDebt = totalStableDebt + totalVariableDebt;

    // Calculate utilization rate
    const utilizationRate = totalLiquidity > 0n
      ? Number(totalDebt) / Number(totalLiquidity)
      : 0;

    return {
      id: metadata.id,
      symbol: assetSymbol,
      name: metadata.name,
      decimals: Number(decimals),
      totalLiquidity: formatUnits(totalLiquidity, Number(decimals)),
      utilizationRate: utilizationRate.toFixed(4),
      variableBorrowRate: rayToPercent(variableBorrowRate),
      stableBorrowRate: rayToPercent(stableBorrowRate),
      liquidityRate: rayToPercent(liquidityRate),
      reserveFactor: bpsToDecimal(reserveFactor),
      ltv: bpsToDecimal(ltv),
      liquidationThreshold: bpsToDecimal(liquidationThreshold),
      // Liquidation bonus in AAVE is stored as 10000 + bonus (e.g., 10500 = 5% bonus)
      liquidationBonus: ((Number(liquidationBonus) - 10000) / 10000).toFixed(4),
      lastUpdateTimestamp: Number(lastUpdateTimestamp) * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error(`Error fetching reserve data for ${assetSymbol}:`, error);
    console.warn(`Falling back to mock data for ${assetSymbol}`);
    return MOCK_RATES[assetSymbol] || MOCK_RATES['USDC'];
  }
}

export async function getUserAccountData(userAddress: string): Promise<UserAccountData> {
  if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000') {
    // Return mock data for invalid/zero address
    return {
      totalCollateralBase: '0',
      totalBorrowsBase: '0',
      availableBorrowsBase: '0',
      currentLiquidationThreshold: '0',
      ltv: '0',
      healthFactor: 'Infinity',
    };
  }

  try {
    const result = await publicClient.readContract({
      address: AAVE_POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: 'getUserAccountData',
      args: [userAddress as `0x${string}`],
    });

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor,
    ] = result;

    // Values are in base currency (USD with 8 decimals in AAVE V3)
    return {
      totalCollateralBase: formatUnits(totalCollateralBase, 8),
      totalBorrowsBase: formatUnits(totalDebtBase, 8),
      availableBorrowsBase: formatUnits(availableBorrowsBase, 8),
      currentLiquidationThreshold: bpsToDecimal(currentLiquidationThreshold),
      ltv: bpsToDecimal(ltv),
      // Health factor is in ray (10^18 in getUserAccountData)
      healthFactor: totalDebtBase === 0n ? 'Infinity' : formatUnits(healthFactor, 18),
    };
  } catch (error) {
    console.error(`Error fetching user account data for ${userAddress}:`, error);
    // Return mock data on error
    return {
      totalCollateralBase: '10000',
      totalBorrowsBase: '3000',
      availableBorrowsBase: '7000',
      currentLiquidationThreshold: '0.80',
      ltv: '0.75',
      healthFactor: '3.33',
    };
  }
}

export async function calculateMaxBorrowAmount(
  collateral: string,
  ltv: string,
  _reserveFactor: string
): Promise<string> {
  // Max borrow = collateral * LTV
  const collateralNum = parseFloat(collateral);
  const ltvNum = parseFloat(ltv);
  const maxBorrow = collateralNum * ltvNum;
  return maxBorrow.toString();
}

export async function calculateHealthFactor(
  totalCollateral: string,
  totalBorrows: string,
  liquidationThreshold: string
): Promise<string> {
  const collateral = parseFloat(totalCollateral);
  const borrows = parseFloat(totalBorrows);
  const threshold = parseFloat(liquidationThreshold);

  if (borrows === 0) {
    return 'Infinity';
  }

  const healthFactor = (collateral * threshold) / borrows;
  return healthFactor.toFixed(2);
}

/**
 * Fetches reserve data for multiple assets in parallel
 */
export async function getMultipleReserveData(symbols: string[]): Promise<Record<string, ReserveData>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const data = await getReserveData(symbol);
      return [symbol, data] as [string, ReserveData];
    })
  );

  return Object.fromEntries(results);
}
