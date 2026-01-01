# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aave Recursive Earn Calculator** - A sophisticated simulator for recursive lending strategies on Aave V3 (Ethereum mainnet). Users can model different borrowing scenarios to understand yields, risks, and leverage effects without real capital.

**Stack**: Next.js 14 (Pages Router), React 18, TypeScript, Wagmi v2, Tailwind CSS, Recharts

## Architecture

### Frontend (Client-Side RPC Calls)
- **No backend**: All RPC calls to Ethereum are made directly from the browser via viem's `publicClient`
- **RPC Provider**: Uses public endpoint (https://eth.llamarpc.com) - no Alchemy key needed for basic functionality
- **Data Flow**: Calculator.tsx → aaveService.ts → publicClient.readContract() → Aave V3 smart contracts → formatted results

### Core Layers

1. **Pages Router** (`pages/`)
   - `index.tsx` - Main page, always shows Calculator (wallet connection removed)
   - `_app.tsx` - Wagmi/ConnectKit setup (kept for future use, not required now)
   - `_document.tsx` - HTML document wrapper

2. **Components** (`src/components/`)
   - `Calculator.tsx` - Input form with live Aave rate fetching (useEffect on asset change)
   - `ResultsDisplay.tsx` - Charts, tables, risk metrics, temporal projections
   - `Tooltip.tsx` - Hover explanations for technical terms
   - `WalletConnect.tsx` - Legacy wallet UI (not used on main page)

3. **Services** (`src/services/`)
   - `aaveService.ts` - Reads reserve data (rates, LTV, liquidation thresholds) from Aave Pool Data Provider contract
     - `getReserveData(symbol)` - Fetches on-chain APY rates, converts RAY format (10^27) → decimal
     - `getSupportedAssets()` - Returns 22+ cryptos grouped by category (Stablecoin, DeFi, LSD, etc.)
     - Falls back to MOCK_RATES if RPC fails
   - `calculator.ts` - Core recursive lending simulation & compound interest
     - `calculateRecursiveCycles()` - Main algorithm with support for simple and compound interest
     - `calculateCompoundInterest()` - Compound formula: A = P × (1 + r/n)^(n×t)
     - Two modes: fixed cycles or until target Health Factor
     - Returns leverage, net APY, liquidation risk metrics, time projections
   - `chartDataGenerator.ts` - Generates time-series data for visualizations
     - `generateCompoundGrowthChart()` - Simple vs compound interest over 5 years
     - `generateMonthlyProjections()` - Monthly position value evolution
     - `generatePositionEvolutionChart()` - Collateral and debt progression by cycle
   - `customAssetsService.ts` - Client-side asset management (localStorage)
     - `saveCustomAsset()`, `updateCustomAsset()`, `deleteCustomAsset()` - CRUD operations
     - `validateCustomAsset()` - Validates symbol, rates, LTV, liquidation threshold
     - Stores up to 50 custom assets locally with version control

4. **Types** (`src/types/aave.ts`)
   - `ReserveData` - Supply/borrow APY, LTV, liquidation threshold from Aave
   - `RecursiveSimulation` - Final results including:
     - collateral, debt, APY net, progression by round
     - `compoundingConfig` - Enabled flag, periods per year, frequency label
     - `timeProjections` - Array of TimeProjection for 1m, 3m, 6m, 1y, 2y
   - `TimeProjection` - Time-based projection data:
     - period, months, interestSimple, interestCompound, totalValueCompound
   - `CompoundingConfig` - Compounding settings:
     - enabled, periodsPerYear, frequencyLabel
   - `RiskMetrics` - Health factor, price drop %, risk level (LOW/MEDIUM/HIGH/CRITICAL)
   - `CustomAsset` - User-defined cryptocurrency:
     - id, type (custom|override), symbol, name, category
     - rates (liquidityRate, variableBorrowRate), risk params (ltv, liquidationThreshold)

## Key Formulas & Logic

### Health Factor Calculation
```
HF = (Total Collateral × Liquidation Threshold) / Total Debt
```

### Recursive Borrowing (Per Cycle)
```
Cycle N:
  - Deposit collateral from Cycle N-1 borrow
  - Borrow = Deposited × Borrow Percentage × LTV
  - Total Debt accumulates
  - Repeat until max cycles or HF target reached
```

### Net APY
```
Net APY = ((Supply Rate × Collateral) - (Borrow Rate × Debt)) / Initial Amount
```

### Compound Interest Calculation
```
Simple Interest (Linear):
  Interest = Principal × Annual Rate × Time (in years)

Compound Interest (Exponential):
  A = P × (1 + r/n)^(n×t)
  Interest = A - P

  Where:
    P = Principal (collateral or debt)
    r = Annual rate (APY as decimal)
    n = Compounding periods per year (365=daily, 52=weekly, 12=monthly, 4=quarterly, or custom)
    t = Time in years

Supply Interest = Compound(totalCollateral, supplyAPY, n, t)
Borrow Interest = Compound(totalDebt, borrowAPY, n, t)
Net Interest = Supply Interest - Borrow Interest
```

## Development Commands

```bash
# Install dependencies (uses legacy-peer-deps for wagmi v2/connectkit compatibility)
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build (Next.js with SWC minification)
npm build

# Type check (TSC without emit)
npm run type-check

# Lint with ESLint
npm run lint

# Production server
npm start
```

## Important Notes

### TypeScript Configuration
- `ignoreBuildErrors: true` - Allows build to succeed despite @metamask/sdk type errors in dependencies
- Path aliases configured: `@/*` → `src/*`, `@components/*` → `src/components/*`, etc.
- Strict mode disabled for compatibility with wagmi v2

### RPC & Data Fetching
- All rate fetching is **frontend-only** (no backend API routes)
- Contract addresses hardcoded in `aaveService.ts`:
  - Pool Data Provider: `0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3`
  - Each asset has Ethereum mainnet address (USDC, DAI, WETH, LINK, etc.)
- RAY conversion: Raw contract rates are 10^27 precision, converted to decimal via `/Number(RAY)`

### Asset Management
- 22+ supported assets with mock fallback rates
- Assets grouped by category (Stablecoin, Major, LSD, DeFi, Other)
- Adding new assets: add address to `ASSET_ADDRESSES` and metadata to `ASSET_METADATA` in `aaveService.ts`

### Custom Assets Management
- Users can add custom cryptocurrencies or override rates via `/CustomAssets/CustomAssetsDrawer.tsx`
- Data stored in browser localStorage (5-10MB limit)
- Each asset has: symbol, name, category, LTV, liquidation threshold, supply/borrow APY, optional address/decimals
- Validation rules:
  - Symbol: 2-10 uppercase alphanumeric, must be unique
  - LTV: 0-100%, must be < Liquidation Threshold
  - Rates: -1000% to 1000% (supports negative for incentivized borrowing)
- Supports two types:
  - **custom**: Brand new cryptocurrency not in Aave
  - **override**: Live Aave asset but with custom promotional rates
- Max 50 custom assets per user
- Uses UUID for unique identification, timestamps for created/updated

### Build Quirks
- Webpack fallback for `fs`, `path`, `crypto` modules (browser environment)
- ConnectKit integration requires @tanstack/react-query as peer dependency
- `.npmrc` has `legacy-peer-deps=true` for wagmi v2 compatibility

## Deployment

- Deployed on Vercel (production: https://aave-recursive-earn-calculator.vercel.app)
- Static site generation - no serverless functions needed
- Environment variables in `.env.local` (see `.env.example`)

## Common Tasks

### Adding a New Cryptocurrency (Live Aave Asset)
1. Find Ethereum mainnet address (etherscan.io)
2. Update `ASSET_ADDRESSES` object in `src/services/aaveService.ts`
3. Update `ASSET_METADATA` with name and category
4. Asset will automatically fetch live rates from Aave

### Adding a Custom Asset or Override Rate
1. Click "Custom Assets" button in the calculator
2. Choose: New Asset (custom) or Override Rates (existing Aave asset)
3. Fill form: symbol, name, category, LTV, liquidation threshold, rates
4. Form validates in real-time; submit button enabled when valid
5. Asset saved to localStorage and appears in dropdown on next calculation
6. Custom assets display with purple dot indicator, overrides with yellow dot

### Modifying Calculation Logic
- Core algorithm in `src/services/calculator.ts`: `calculateRecursiveCycles()`
- Compound interest functions: `calculateCompoundInterest()` and `calculateNetCompoundInterest()`
- Adjust cycle limits, Health Factor thresholds, or formulas here
- Update `RecursiveSimulation` type if adding new output fields
- **Important**: If modifying interest calculations, also update `chartDataGenerator.ts` for consistency

### Modifying Compound Interest Logic
- Core logic in `src/services/calculator.ts`: `calculateCompoundInterest()` and `calculateNetCompoundInterest()`
- In `chartDataGenerator.ts`: same functions used for graph data
- Frequency options: daily (365), weekly (52), monthly (12), quarterly (4), custom (N days)
- To adjust: modify periodsPerYear calculation in `getPeriodsPerYear()` function
- Remember to update both `calculator.ts` AND `chartDataGenerator.ts` for consistency

### Modifying Chart Visualizations
- Charts in `src/components/ResultsDisplay.tsx` use Recharts with data from `chartDataGenerator.ts`
- Three charts displayed (only Compound Growth shown if compounding enabled):
  1. **Compound Growth** (line chart) - Simple vs compound interest over 5 years
  2. **Position Value Evolution** (area chart) - 5-year projection of total position value
  3. **Cycles Progression** (bar chart) - Collateral vs debt accumulated per cycle
- To add a new chart:
  1. Create data generator function in `chartDataGenerator.ts` (export interface + function)
  2. Import and call it in `ResultsDisplay.tsx`
  3. Use ResponsiveContainer from recharts with desired chart type (LineChart, AreaChart, BarChart, etc.)
  4. Style with theme colors: purple (#8b5cf6), green (#10b981), blue (#3b82f6), red (#ef4444)

### Improving UI/Results Display
- Charts in `src/components/ResultsDisplay.tsx` use Recharts
- Add new stat cards in the summary section
- Temporal projections now generated with compound interest support
- Custom asset data merged with live Aave data in dropdown

### Testing with Different Assets
- Change dropdown in Calculator to see live rate updates (automatic RPC call)
- Each asset fetch is independent - failures fall back to mock data
- DevTools Network tab shows `eth.llamarpc.com` POST requests with contract calls
- Test custom assets by clicking "Custom Assets" button and creating test entries
- Custom assets persist across browser sessions (stored in localStorage)
