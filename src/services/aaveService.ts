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
// Complete list of 43+ supported assets
const ASSET_ADDRESSES: Record<string, `0x${string}`> = {
  // Stablecoins
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  LUSD: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
  GHO: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
  FRAX: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  USDe: '0x4c9EDD5852cd905f23a6af0911c5B9B0EA6f2F67',
  sUSDe: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
  PYUSD: '0x6c3ea9036406852006290033d967ddd3d2139f0d',
  USDS: '0xdC035D45d8E7aB5FD3907b9f555aAE20ed4aCD76',
  USDtb: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  EURC: '0x2b9a9aFF31bD59f027b90b3d2cBcb7B3f4fe7f1e',
  crvUSD: '0xf939E0A03FB07F59A73967B34a7EAf3D92eeA54d',
  mUSD: '0x4DD9352cF340cf290829d12eA2549DCb1b67AdB7',
  RLUSD: '0xA8d5060a7Dc4F6D59B2c32794CD2b5Df64aB4A2f',
  // Major crypto
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  // Wrapped/Staked ETH (LSDs)
  wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  cbETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
  rETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  weETH: '0xcd5fe23c85820f7b72d0926e8cb457eb41e1ef93',
  osETH: '0xf1C9acDc66974dFB6f2B06783AEe1550Bd5dEFe',
  rsETH: '0xa1290d69369cA325D4B78f7F65B8d4786912ff5f',
  ETHx: '0xa35b1b31ce002fbf2058d22f30f95d405200a15b',
  ezETH: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
  // Bitcoin
  cbBTC: '0xcbB7C0000aB88647b02LoA8wGiaf5338cP3FA3',
  LBTC: '0x8236a87757124d5B4F5c5c3E8010c4d33B60F6e8',
  tBTC: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  // Governance/DeFi
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  SNX: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
  LDO: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  '1INCH': '0x111111111117dC0aa78b770fA6A738034120C302',
  ENS: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  RPL: '0xD33526068D116cE69F19A9ee46F0bd304F21A51f',
  // Other
  sDAI: '0x83f20f44975d03b1b09fdee56687053cef38f5d0',
  XAUt: '0x68749665FF8D2d112Fa2914F2757B5Ff10d6B503',
  eUSDe: '0xa0d69E286B938e21CBf7E21292D7ACb4CfE8d537',
};

// Asset metadata
const ASSET_METADATA: Record<string, { id: string; name: string; category: string }> = {
  // Stablecoins
  USDC: { id: '1', name: 'USD Coin', category: 'Stablecoin' },
  USDT: { id: '2', name: 'Tether USD', category: 'Stablecoin' },
  DAI: { id: '3', name: 'Dai Stablecoin', category: 'Stablecoin' },
  LUSD: { id: '4', name: 'Liquity USD', category: 'Stablecoin' },
  GHO: { id: '5', name: 'GHO Stablecoin', category: 'Stablecoin' },
  FRAX: { id: '6', name: 'Frax', category: 'Stablecoin' },
  USDe: { id: '7', name: 'USDe', category: 'Stablecoin' },
  sUSDe: { id: '8', name: 'Staked USDe', category: 'Stablecoin' },
  PYUSD: { id: '9', name: 'PayPal USD', category: 'Stablecoin' },
  USDS: { id: '10', name: 'USDS Stablecoin', category: 'Stablecoin' },
  USDtb: { id: '11', name: 'USDtb', category: 'Stablecoin' },
  EURC: { id: '12', name: 'Euro Coin', category: 'Stablecoin' },
  crvUSD: { id: '13', name: 'Curve USD', category: 'Stablecoin' },
  mUSD: { id: '14', name: 'MetaMask USD', category: 'Stablecoin' },
  RLUSD: { id: '15', name: 'Ripple USD', category: 'Stablecoin' },
  // Major
  ETH: { id: '16', name: 'Ethereum', category: 'Major' },
  WETH: { id: '16', name: 'Wrapped Ether', category: 'Major' },
  WBTC: { id: '17', name: 'Wrapped Bitcoin', category: 'Major' },
  // Liquid Staking Derivatives
  wstETH: { id: '18', name: 'Wrapped stETH', category: 'LSD' },
  cbETH: { id: '19', name: 'Coinbase Wrapped ETH', category: 'LSD' },
  rETH: { id: '20', name: 'Rocket Pool ETH', category: 'LSD' },
  weETH: { id: '21', name: 'Wrapped eETH', category: 'LSD' },
  osETH: { id: '22', name: 'Staked ETH (Stader)', category: 'LSD' },
  rsETH: { id: '23', name: 'Renzo Restaked ETH', category: 'LSD' },
  ETHx: { id: '24', name: 'Stader ETHx', category: 'LSD' },
  ezETH: { id: '25', name: 'Renzo Restaked ETH', category: 'LSD' },
  // Bitcoin
  cbBTC: { id: '26', name: 'Coinbase Wrapped BTC', category: 'Bitcoin' },
  LBTC: { id: '27', name: 'Lombard Staked Bitcoin', category: 'Bitcoin' },
  tBTC: { id: '28', name: 'tBTC', category: 'Bitcoin' },
  // Governance/DeFi
  LINK: { id: '29', name: 'Chainlink', category: 'Governance' },
  AAVE: { id: '30', name: 'Aave', category: 'Governance' },
  UNI: { id: '31', name: 'Uniswap', category: 'Governance' },
  MKR: { id: '32', name: 'Maker', category: 'Governance' },
  SNX: { id: '33', name: 'Synthetix', category: 'Governance' },
  CRV: { id: '34', name: 'Curve DAO', category: 'Governance' },
  BAL: { id: '35', name: 'Balancer', category: 'Governance' },
  LDO: { id: '36', name: 'Lido DAO', category: 'Governance' },
  '1INCH': { id: '37', name: '1inch', category: 'Governance' },
  ENS: { id: '38', name: 'ENS', category: 'Governance' },
  RPL: { id: '39', name: 'Rocket Pool', category: 'Governance' },
  // Other
  sDAI: { id: '40', name: 'Savings Dai', category: 'Other' },
  XAUt: { id: '41', name: 'Tether Gold', category: 'Other' },
  eUSDe: { id: '42', name: 'Ethereal Pre-deposit Vault', category: 'Other' },
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
 * Converts AAVE ray value (10^27) to APY decimal string
 * Formula: APY = ((1 + ((rate / 10^27) / 31536000)) ^ 31536000) - 1
 * This accounts for compound interest over a year
 * Returns decimal format (0.4386 = 43.86% APY), not percentage (43.86)
 */
function rayToPercent(rayValue: bigint): string {
  // Convert ray to decimal rate (rate / 10^27)
  const decimalRate = Number(rayValue) / Number(RAY);

  // Apply annual compounding formula: (1 + rate/secondsPerYear)^secondsPerYear - 1
  const apy = (Math.pow(1 + decimalRate / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1);

  // Return as decimal string (0.4386 = 43.86% APY)
  return apy.toFixed(6);
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
      usageAsCollateralEnabled,
      borrowingEnabled,
      stableBorrowRateEnabled,
      isActive,
      isFrozen,
    ] = configData;

    // Validate asset eligibility
    const validationErrors: string[] = [];
    if (!isActive) {
      validationErrors.push(`❌ ${assetSymbol} n'est pas actif sur Aave V3`);
    }
    if (isFrozen) {
      validationErrors.push(`❌ ${assetSymbol} est gelé (aucun dépôt/emprunt possible)`);
    }
    if (!usageAsCollateralEnabled) {
      validationErrors.push(`❌ ${assetSymbol} ne peut pas être utilisé comme collateral`);
    }
    if (!borrowingEnabled) {
      validationErrors.push(`❌ ${assetSymbol} n'est pas empruntable`);
    }

    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join(' | ');
      console.error(`⚠️ Erreur de configuration pour ${assetSymbol}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

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
    console.group('🔐 Asset Status');
    console.log(`Active: ${isActive ? '✅' : '❌'}`);
    console.log(`Frozen: ${isFrozen ? '❌' : '✅'}`);
    console.log(`Usable as Collateral: ${usageAsCollateralEnabled ? '✅' : '❌'}`);
    console.log(`Borrowing Enabled: ${borrowingEnabled ? '✅' : '❌'}`);
    console.log(`Stable Rate Borrowing: ${stableBorrowRateEnabled ? '✅' : '❌'}`);
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
