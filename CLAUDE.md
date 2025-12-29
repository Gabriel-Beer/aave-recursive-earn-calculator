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
   - `calculator.ts` - Core recursive lending simulation
     - `calculateRecursiveCycles()` - Main algorithm: each cycle borrows on NEW deposited amount
     - Two modes: fixed cycles or until target Health Factor
     - Returns leverage, APY net, liquidation risk metrics

4. **Types** (`src/types/aave.ts`)
   - `ReserveData` - Supply/borrow APY, LTV, liquidation threshold from Aave
   - `RecursiveSimulation` - Final results: collateral, debt, APY net, progression by round
   - `RiskMetrics` - Health factor, price drop %, risk level (LOW/MEDIUM/HIGH/CRITICAL)

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

### Build Quirks
- Webpack fallback for `fs`, `path`, `crypto` modules (browser environment)
- ConnectKit integration requires @tanstack/react-query as peer dependency
- `.npmrc` has `legacy-peer-deps=true` for wagmi v2 compatibility

## Deployment

- Deployed on Vercel (production: https://aave-recursive-earn-calculator.vercel.app)
- Static site generation - no serverless functions needed
- Environment variables in `.env.local` (see `.env.example`)

## Common Tasks

### Adding a New Cryptocurrency
1. Find Ethereum mainnet address (etherscan.io)
2. Update `ASSET_ADDRESSES` object in `src/services/aaveService.ts`
3. Update `ASSET_METADATA` with name and category
4. Asset will automatically fetch live rates from Aave

### Modifying Calculation Logic
- Core algorithm in `src/services/calculator.ts`: `calculateRecursiveCycles()`
- Adjust cycle limits, Health Factor thresholds, or formulas here
- Update `RecursiveSimulation` type if adding new output fields

### Improving UI/Results Display
- Charts in `src/components/ResultsDisplay.tsx` use Recharts
- Add new stat cards in the summary section
- Temporal projections calculated from annual APY (divide by 12 for months)

### Testing with Different Assets
- Change dropdown in Calculator to see live rate updates (automatic RPC call)
- Each asset fetch is independent - failures fall back to mock data
- DevTools Network tab shows `eth.llamarpc.com` POST requests with contract calls
