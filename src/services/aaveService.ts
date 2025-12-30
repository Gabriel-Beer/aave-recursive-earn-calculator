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

// Asset addresses on Ethereum Mainnet (Aave V3)
const ASSET_ADDRESSES: Record<string, `0x${string}`> = {
  // Stablecoins
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  FRAX: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  LUSD: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
  // Major cryptos
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  // DeFi tokens
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  SNX: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  // LSDs (Liquid Staking Derivatives)
  wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  rETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  cbETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
  // Other
  ENS: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  '1INCH': '0x111111111117dC0aa78b770fA6A738034120C302',
  LDO: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  RPL: '0xD33526068D116cE69F19A9ee46F0bd304F21A51f',
  BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
  GHO: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
};

// Asset metadata
const ASSET_METADATA: Record<string, { id: string; name: string; category: string }> = {
  // Stablecoins
  USDC: { id: '1', name: 'USD Coin', category: 'Stablecoin' },
  DAI: { id: '2', name: 'Dai Stablecoin', category: 'Stablecoin' },
  USDT: { id: '3', name: 'Tether USD', category: 'Stablecoin' },
  FRAX: { id: '6', name: 'Frax', category: 'Stablecoin' },
  LUSD: { id: '7', name: 'Liquity USD', category: 'Stablecoin' },
  GHO: { id: '24', name: 'GHO Stablecoin', category: 'Stablecoin' },
  // Major cryptos
  ETH: { id: '4', name: 'Ethereum', category: 'Major' },
  WETH: { id: '4', name: 'Wrapped Ether', category: 'Major' },
  WBTC: { id: '5', name: 'Wrapped Bitcoin', category: 'Major' },
  // DeFi tokens
  LINK: { id: '8', name: 'Chainlink', category: 'DeFi' },
  AAVE: { id: '9', name: 'Aave', category: 'DeFi' },
  UNI: { id: '10', name: 'Uniswap', category: 'DeFi' },
  MKR: { id: '11', name: 'Maker', category: 'DeFi' },
  SNX: { id: '12', name: 'Synthetix', category: 'DeFi' },
  CRV: { id: '13', name: 'Curve DAO', category: 'DeFi' },
  BAL: { id: '23', name: 'Balancer', category: 'DeFi' },
  '1INCH': { id: '19', name: '1inch', category: 'DeFi' },
  // LSDs
  wstETH: { id: '14', name: 'Wrapped stETH', category: 'LSD' },
  rETH: { id: '15', name: 'Rocket Pool ETH', category: 'LSD' },
  cbETH: { id: '16', name: 'Coinbase ETH', category: 'LSD' },
  // Other
  ENS: { id: '17', name: 'ENS', category: 'Other' },
  LDO: { id: '20', name: 'Lido DAO', category: 'Other' },
  RPL: { id: '21', name: 'Rocket Pool', category: 'Other' },
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
const SECONDS_PER_YEAR = 31536000; // Number of seconds in a year

/**
 * Converts AAVE ray value (10^27) to APY percentage string
 * Formula: APY = (((1 + ((rate / 10^27) / 31536000)) ^ 31536000) - 1) * 100
 * This accounts for compound interest over a year
 */
function rayToPercent(rayValue: bigint): string {
  // Convert ray to decimal rate (rate / 10^27)
  const decimalRate = Number(rayValue) / Number(RAY);

  // Apply annual compounding formula: (1 + rate/secondsPerYear)^secondsPerYear - 1
  const apy = (Math.pow(1 + decimalRate / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1);

  // Return as percentage string (multiply by 100 for percentage, but keep 6 decimals for precision)
  return (apy * 100).toFixed(6);
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
    // Log RPC request details
    console.log(`🔗 Fetching Aave V3 data for ${assetSymbol} (${assetAddress})`);
    console.log(`   RPC Endpoint: ${process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'}`);
    console.log(`   Pool Data Provider: ${AAVE_POOL_DATA_PROVIDER}`);

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

    console.log(`✅ RPC response received (2 calls, eth_call method)`);

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

    // Parse rates for console output
    const supplyAPY = rayToPercent(liquidityRate);
    const borrowAPY = rayToPercent(variableBorrowRate);
    const ltvPercent = bpsToDecimal(ltv);
    const liqThresholdPercent = bpsToDecimal(liquidationThreshold);

    // Log decoded response data
    console.group(`📊 Aave V3 Reserve Data - ${assetSymbol}`);
    console.log(`Asset Address: ${assetAddress}`);
    console.log(`Contract: ${AAVE_POOL_DATA_PROVIDER}`);
    console.group('📈 Rates (APY)');
    console.log(`Supply APY: ${supplyAPY} (${(parseFloat(supplyAPY) * 100).toFixed(2)}%)`);
    console.log(`Borrow APY: ${borrowAPY} (${(parseFloat(borrowAPY) * 100).toFixed(2)}%)`);
    console.log(`Stable Borrow APY: ${rayToPercent(stableBorrowRate)} (${(parseFloat(rayToPercent(stableBorrowRate)) * 100).toFixed(2)}%)`);
    console.groupEnd();
    console.group('💰 Liquidity');
    console.log(`Total Supplied: ${formatUnits(totalLiquidity, Number(decimals))} ${assetSymbol}`);
    console.log(`Total Stable Debt: ${formatUnits(totalStableDebt, Number(decimals))} ${assetSymbol}`);
    console.log(`Total Variable Debt: ${formatUnits(totalVariableDebt, Number(decimals))} ${assetSymbol}`);
    console.log(`Utilization Rate: ${(utilizationRate * 100).toFixed(2)}%`);
    console.groupEnd();
    console.group('⚙️ Configuration');
    console.log(`LTV (Loan-to-Value): ${ltvPercent} (${(parseFloat(ltvPercent) * 100).toFixed(2)}%)`);
    console.log(`Liquidation Threshold: ${liqThresholdPercent} (${(parseFloat(liqThresholdPercent) * 100).toFixed(2)}%)`);
    console.log(`Liquidation Bonus: ${((Number(liquidationBonus) - 10000) / 10000).toFixed(4)} (${(((Number(liquidationBonus) - 10000) / 100)).toFixed(2)}%)`);
    console.log(`Reserve Factor: ${bpsToDecimal(reserveFactor)} (${(parseFloat(bpsToDecimal(reserveFactor)) * 100).toFixed(2)}%)`);
    console.log(`Decimals: ${Number(decimals)}`);
    console.log(`Last Update: ${new Date(Number(lastUpdateTimestamp) * 1000).toISOString()}`);
    console.groupEnd();
    console.groupEnd();

    return {
      id: metadata.id,
      symbol: assetSymbol,
      name: metadata.name,
      decimals: Number(decimals),
      totalLiquidity: formatUnits(totalLiquidity, Number(decimals)),
      utilizationRate: utilizationRate.toFixed(4),
      variableBorrowRate: borrowAPY,
      stableBorrowRate: rayToPercent(stableBorrowRate),
      liquidityRate: supplyAPY,
      reserveFactor: bpsToDecimal(reserveFactor),
      ltv: ltvPercent,
      liquidationThreshold: liqThresholdPercent,
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

/**
 * Returns list of all supported assets grouped by category
 */
export function getSupportedAssets(): { symbol: string; name: string; category: string }[] {
  return Object.entries(ASSET_METADATA)
    .filter(([symbol]) => symbol !== 'WETH') // Hide WETH duplicate, use ETH instead
    .map(([symbol, meta]) => ({
      symbol,
      name: meta.name,
      category: meta.category,
    }))
    .sort((a, b) => {
      // Sort by category order, then alphabetically
      const categoryOrder: Record<string, number> = {
        'Stablecoin': 1,
        'Major': 2,
        'LSD': 3,
        'DeFi': 4,
        'Other': 5
      };
      const catDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
      if (catDiff !== 0) return catDiff;
      return a.symbol.localeCompare(b.symbol);
    });
}

/**
 * Get asset categories for grouping in UI
 */
export function getAssetCategories(): string[] {
  return ['Stablecoin', 'Major', 'LSD', 'DeFi', 'Other'];
}
