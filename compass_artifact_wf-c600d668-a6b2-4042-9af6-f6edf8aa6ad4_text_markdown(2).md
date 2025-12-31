# Guide complet de l'API Aave pour les stratégies de looping

Les développeurs construisant des applications de looping sur Aave disposent de **quatre méthodes d'accès aux données** : l'API REST officielle (limitée), les SDK TypeScript/React, les subgraphs GraphQL via The Graph, et l'interaction directe avec les smart contracts. Pour une application de calcul de looping en temps réel, **la combinaison SDK @aave/contract-helpers + appels directs aux contrats** offre le meilleur compromis précision/simplicité, tandis que les subgraphs GraphQL excellent pour les données historiques.

---

## L'écosystème Aave ne propose pas d'API REST complète

Contrairement aux attentes, Aave **ne fournit pas d'API REST exhaustive**. Une API existe à `https://aave-api-v2.aave.com/` mais elle est limitée aux données V2 et considérée comme outil secondaire. Pour V3 et les fonctionnalités modernes, Aave recommande explicitement ses SDK TypeScript ou les subgraphs GraphQL.

Cette architecture décentralisée s'explique par la philosophie Web3 : les données de référence vivent sur la blockchain, et les développeurs sont encouragés à les interroger directement plutôt que via des intermédiaires centralisés.

### Les quatre voies d'accès aux données Aave

| Méthode | Temps réel | Historique | Complexité | Cas d'usage principal |
|---------|------------|------------|------------|----------------------|
| **Smart contracts directs** | ✅ Oui | ❌ Non | Moyenne | Données critiques (health factor, taux actuels) |
| **SDK @aave/contract-helpers** | ✅ Oui | ❌ Non | Faible | Application complète avec formatage |
| **Subgraphs GraphQL** | ⚠️ Délai indexation | ✅ Oui | Moyenne | Analytics, historique transactions |
| **Services tiers** | Variable | Variable | Faible | Prototypage rapide, données agrégées |

---

## Les SDK officiels simplifient considérablement l'intégration

### AaveKit : la nouvelle génération de SDK

Le SDK **@aave/client** (TypeScript) et **@aave/react** constituent la solution officielle recommandée pour les nouveaux projets V3. Leur architecture modulaire inspirée de viem facilite l'intégration.

```typescript
import { AaveClient, evmAddress, chainId } from "@aave/client";
import { userSupplies, markets } from "@aave/client/actions";

const client = AaveClient.create();

// Récupérer les données de marché
const marketsData = await markets(client, {
  chainIds: [chainId(1), chainId(137)] // Ethereum, Polygon
});

// Positions d'un utilisateur
const positions = await userSupplies(client, {
  markets: [evmAddress('0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2')],
  user: evmAddress('0x...'),
});
```

### @aave/contract-helpers et @aave/math-utils pour V2/V3

Ces packages forment le cœur technique de l'intégration Aave pour les projets existants :

```typescript
import { UiPoolDataProvider } from '@aave/contract-helpers';
import { formatReserves, formatUserSummary } from '@aave/math-utils';
import * as markets from '@bgd-labs/aave-address-book';

const poolDataProvider = new UiPoolDataProvider({
  uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  provider,
  chainId: 1
});

// Toutes les réserves en un appel
const { reservesData, baseCurrencyData } = await poolDataProvider.getReservesHumanized({
  lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER
});

// Données utilisateur avec health factor calculé
const userReserves = await poolDataProvider.getUserReservesHumanized({
  lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  user: userAddress
});

// Formatage avec calculs temps réel (intérêts, APY)
const formattedReserves = formatReserves({
  reserves: reservesData,
  currentTimestamp: Math.floor(Date.now() / 1000),
  marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
  marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd
});

const userSummary = formatUserSummary({
  currentTimestamp: Math.floor(Date.now() / 1000),
  marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
  userReserves: userReserves.userReserves,
  formattedReserves,
  userEmodeCategoryId: userReserves.userEmodeCategoryId
});

// Données clés pour le looping
console.log('Health Factor:', userSummary.healthFactor);
console.log('Available to Borrow (USD):', userSummary.availableBorrowsUSD);
console.log('LTV:', userSummary.currentLoanToValue);
```

**Packages NPM officiels à installer :**
- `@aave/client` - SDK TypeScript moderne (V3/V4)
- `@aave/react` - Hooks React avec AaveProvider
- `@aave/contract-helpers` - Interaction contrats V2/V3
- `@aave/math-utils` - Calculs et formatage
- `@bgd-labs/aave-address-book` - Adresses déployées par réseau

---

## Les subgraphs GraphQL excellent pour l'historique et l'analytics

Aave maintient des subgraphs sur **20+ réseaux** via The Graph Protocol. Ces endpoints indexent chaque transaction on-chain et exposent des schémas GraphQL riches.

### Endpoints principaux

| Réseau | Subgraph ID (The Graph Explorer) |
|--------|----------------------------------|
| **ETH Mainnet V3** | `Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g` |
| **Polygon V3** | `Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4dMedAq211` |
| **Arbitrum V3** | `DLuE98kEb5pQNXAcKFQGQgfSQ57Xdou4jnVbAEqMfy3B` |
| **Optimism V3** | `DSfLz8oQBUeU5atALgUFQKMTSYV9mZAVYp4noLSXAfvb` |
| **Base V3** | `GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF` |

### Requêtes GraphQL essentielles pour le looping

**Récupérer les paramètres LTV et liquidation par actif :**

```graphql
{
  reserves(where: {usageAsCollateralEnabled: true}) {
    symbol
    underlyingAsset
    baseLTVasCollateral        # LTV max (basis points, /10000)
    reserveLiquidationThreshold # Seuil liquidation
    reserveLiquidationBonus    # Bonus liquidateur
    liquidityRate              # Supply APR (RAY units, /10^27)
    variableBorrowRate         # Borrow APR variable
    availableLiquidity         # Liquidité empruntable
    totalCurrentVariableDebt   # Dette totale
  }
}
```

**Historique des taux d'une réserve (backtesting) :**

```graphql
{
  reserve(id: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2") {
    paramsHistory(first: 1000, orderBy: timestamp, orderDirection: desc) {
      timestamp
      liquidityRate
      variableBorrowRate
      utilizationRate
    }
  }
}
```

**Position complète d'un utilisateur :**

```graphql
{
  userReserves(where: {user: "0x..."}) {
    reserve {
      symbol
      underlyingAsset
      decimals
    }
    currentATokenBalance      # Supply
    currentVariableDebt       # Dette
    usageAsCollateralEnabledOnUser
  }
}
```

**Limitation critique :** Les données GraphQL représentent l'état au moment de l'indexation, pas en temps réel. Les balances aToken/debtToken accumulent des intérêts continuellement. Pour des calculs précis de health factor, **toujours utiliser les appels on-chain directs**.

---

## L'interaction directe avec les smart contracts garantit la précision temps réel

Pour une application de looping où la précision du health factor est critique, les appels directs aux contrats Aave sont indispensables.

### Contrats clés et leurs fonctions

| Contrat | Fonction | Données retournées |
|---------|----------|-------------------|
| **Pool** | `getUserAccountData(user)` | totalCollateral, totalDebt, availableBorrows, **healthFactor**, ltv |
| **Pool** | `getReserveData(asset)` | Taux actuels, indices, configuration |
| **AaveProtocolDataProvider** | `getReserveConfigurationData(asset)` | LTV, liquidationThreshold, decimals |
| **AaveProtocolDataProvider** | `getUserReserveData(asset, user)` | Balance aToken, dette, collateral enabled |
| **AaveOracle** | `getAssetPrice(asset)` | Prix en USD (8 décimales) |

### Adresses des contrats Aave V3

```javascript
// Ethereum Mainnet
const ADDRESSES = {
  Pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  PoolAddressesProvider: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
  AaveProtocolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
  AaveOracle: '0x54586bE62E3c3580375aE3723C145253060Ca0C2'
};

// Polygon, Arbitrum, Optimism (déploiement déterministe)
const L2_ADDRESSES = {
  Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  PoolAddressesProvider: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
  AaveProtocolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
};
```

### Exemple complet avec ethers.js

```javascript
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');

// ABIs minimaux (format human-readable)
const POOL_ABI = [
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReservesList() view returns (address[])'
];

const DATA_PROVIDER_ABI = [
  'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
  'function getReserveData(address asset) view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)'
];

const pool = new ethers.Contract(ADDRESSES.Pool, POOL_ABI, provider);
const dataProvider = new ethers.Contract(ADDRESSES.AaveProtocolDataProvider, DATA_PROVIDER_ABI, provider);

// Données utilisateur temps réel
async function getUserPosition(userAddress) {
  const data = await pool.getUserAccountData(userAddress);
  return {
    totalCollateralUSD: ethers.utils.formatUnits(data.totalCollateralBase, 8),
    totalDebtUSD: ethers.utils.formatUnits(data.totalDebtBase, 8),
    availableBorrowsUSD: ethers.utils.formatUnits(data.availableBorrowsBase, 8),
    liquidationThreshold: Number(data.currentLiquidationThreshold) / 100, // %
    ltv: Number(data.ltv) / 100, // %
    healthFactor: ethers.utils.formatUnits(data.healthFactor, 18)
  };
}

// Paramètres de risque d'un actif
async function getAssetRiskParams(assetAddress) {
  const config = await dataProvider.getReserveConfigurationData(assetAddress);
  const reserve = await dataProvider.getReserveData(assetAddress);
  
  const RAY = ethers.BigNumber.from(10).pow(27);
  
  return {
    ltv: Number(config.ltv) / 100, // % (ex: 77 pour 77%)
    liquidationThreshold: Number(config.liquidationThreshold) / 100,
    liquidationBonus: Number(config.liquidationBonus) / 100 - 100, // % bonus
    supplyAPR: Number(reserve.liquidityRate.mul(100).div(RAY)),
    borrowAPR: Number(reserve.variableBorrowRate.mul(100).div(RAY)),
    utilizationRate: reserve.totalVariableDebt.mul(100).div(reserve.totalAToken.add(reserve.totalVariableDebt))
  };
}
```

---

## Calculs essentiels pour les stratégies de looping

### Formules fondamentales

Le looping exploite le LTV pour amplifier l'exposition. Avec un dépôt initial **D** et un LTV de **L** :

```
Leverage maximum théorique = 1 / (1 - LTV)

Exemple avec LTV 82.5% : 1 / (1 - 0.825) = 5.71x
```

**Dépôt total après N loops :**
```
Dépôt_total = D × (1 - L^(n+1)) / (1 - L)

Limite (n→∞) = D / (1 - L)

Exemple: $1000 avec LTV 77%
Dépôt final max = 1000 / (1 - 0.77) = $4,347 (leverage 4.35x)
```

**Net APY (rendement après coûts d'emprunt) :**
```javascript
function calculateNetAPY(supplyAPY, borrowAPY, leverage) {
  return (supplyAPY * leverage) - (borrowAPY * (leverage - 1));
}

// Exemple: Supply 6%, Borrow 2%, Leverage 3x
// Net APY = (6% × 3) - (2% × 2) = 18% - 4% = 14%

// Attention: si Borrow > Supply, le looping devient coûteux
// Exemple perdant: Supply 3%, Borrow 5%, Leverage 3x
// Net APY = (3% × 3) - (5% × 2) = 9% - 10% = -1%
```

**Health Factor après looping :**
```javascript
function calculateHealthFactorAfterLoop(
  currentCollateralUSD,
  currentDebtUSD,
  additionalCollateralUSD,
  additionalBorrowUSD,
  liquidationThreshold
) {
  const newCollateral = currentCollateralUSD + additionalCollateralUSD;
  const newDebt = currentDebtUSD + additionalBorrowUSD;
  return (newCollateral * liquidationThreshold) / newDebt;
}

// Recommandation: maintenir HF > 1.5 pour sécurité
// HF < 1 → Position liquidable
```

### Module de simulation de looping complet

```typescript
interface LoopingSimulation {
  initialDeposit: number;
  targetLeverage: number;
  assetLTV: number;
  liquidationThreshold: number;
  supplyAPY: number;
  borrowAPY: number;
}

function simulateLooping(params: LoopingSimulation) {
  const { initialDeposit, targetLeverage, assetLTV, liquidationThreshold, supplyAPY, borrowAPY } = params;
  
  // Vérification du leverage possible
  const maxLeverage = 1 / (1 - assetLTV);
  if (targetLeverage > maxLeverage) {
    throw new Error(`Leverage ${targetLeverage}x impossible. Max: ${maxLeverage.toFixed(2)}x`);
  }
  
  // Calcul du nombre de loops nécessaires
  const targetExposure = initialDeposit * targetLeverage;
  const loopsRequired = Math.ceil(
    Math.log(1 - targetExposure / initialDeposit * (1 - assetLTV)) / Math.log(assetLTV)
  );
  
  // Position finale
  const finalCollateral = initialDeposit * targetLeverage;
  const finalDebt = initialDeposit * (targetLeverage - 1);
  
  // Health factor résultant
  const healthFactor = (finalCollateral * liquidationThreshold) / finalDebt;
  
  // Net APY
  const netAPY = (supplyAPY * targetLeverage) - (borrowAPY * (targetLeverage - 1));
  
  // Prix de liquidation (pour ETH/USD par exemple)
  // Si collateral = ETH, dette = stablecoin
  const liquidationPrice = finalDebt / (finalCollateral * liquidationThreshold);
  
  return {
    finalCollateralUSD: finalCollateral,
    finalDebtUSD: finalDebt,
    healthFactor,
    netAPY,
    loopsRequired,
    maxSafeDropPercent: ((healthFactor - 1) / healthFactor) * 100,
    warning: healthFactor < 1.5 ? 'RISQUE ÉLEVÉ: Health Factor < 1.5' : null
  };
}

// Exemple d'utilisation
const simulation = simulateLooping({
  initialDeposit: 10000,      // $10,000
  targetLeverage: 3,          // 3x
  assetLTV: 0.77,             // 77%
  liquidationThreshold: 0.80, // 80%
  supplyAPY: 0.05,            // 5%
  borrowAPY: 0.03             // 3%
});

console.log(simulation);
// {
//   finalCollateralUSD: 30000,
//   finalDebtUSD: 20000,
//   healthFactor: 1.2,
//   netAPY: 0.09 (9%),
//   loopsRequired: ~7,
//   maxSafeDropPercent: 16.67%,
//   warning: 'RISQUE ÉLEVÉ: Health Factor < 1.5'
// }
```

---

## Architecture recommandée pour une application de looping

### Stack technique conseillé

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  @aave/react hooks │ Simulation UI │ Position monitoring    │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                     BACKEND / SERVICE LAYER                  │
├─────────────────────────────────────────────────────────────┤
│  - Calculs de looping (Net APY, leverage, liquidation risk) │
│  - Cache des données de marché (Redis)                      │
│  - Alertes Health Factor                                    │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├──────────────────┬──────────────────┬───────────────────────┤
│ TEMPS RÉEL       │ HISTORIQUE       │ PRIX                  │
│ @aave/contract-  │ GraphQL          │ AaveOracle +          │
│ helpers +        │ Subgraphs        │ Chainlink             │
│ ethers.js        │                  │                       │
└──────────────────┴──────────────────┴───────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│              RPC PROVIDERS (multi-chain)                     │
│  Alchemy │ Infura │ QuickNode │ Public RPCs                 │
└─────────────────────────────────────────────────────────────┘
```

### Services complémentaires pour enrichir les données

| Service | Utilité | Endpoint clé |
|---------|---------|--------------|
| **DefiLlama** | Yields historiques, TVL | `GET https://yields.llama.fi/pools` |
| **GoldRush/Covalent** | Endpoints Aave-spécifiques | `GET /v1/cq/covalent/app/aave/markets` |
| **DeFi Saver** | Automation liquidation | Smart contracts d'automation |

---

## Outils existants pour le looping automatisé

Plutôt que d'implémenter les transactions de looping manuellement (45+ transactions pour atteindre le leverage max), plusieurs protocoles proposent des solutions en **une seule transaction** via flash loans.

### DeFi Saver
- **Boost/Repay** : Augmentation/réduction de leverage instantanée
- **Automation** : Protection contre liquidation
- **Minimum requis** : $30,000 dette (Mainnet), $500 (L2)

### Instadapp
- Dashboard unifié Aave V2/V3
- Leverage en 1 transaction
- Automation avec trigger personnalisable

### Flash Loan pour leverage instantané

```solidity
// Concept: au lieu de 45 loops
// 1. Flash loan du montant nécessaire
// 2. Dépôt total (initial + flash)
// 3. Emprunt pour rembourser le flash
// → Résultat: leverage en 1 tx

// Exemple: $100 initial → $434 collateral (4.3x) en 1 transaction
// Flash $334 → Dépôt $434 → Emprunt $334 (77%) → Rembourse flash
```

---

## Limitations et considérations importantes

### Unités et conversions à maîtriser

| Unité | Valeur | Usage |
|-------|--------|-------|
| **RAY** | 10^27 | Taux d'intérêt (APR) |
| **WAD** | 10^18 | Health factor |
| **Basis points** | 10^4 | LTV, liquidation threshold |
| **Prix Oracle** | 8 décimales | USD |

```javascript
// Conversion RAY vers pourcentage
const aprPercent = rayValue.mul(100).div(ethers.BigNumber.from(10).pow(27));

// Conversion basis points vers pourcentage
const ltvPercent = basisPoints / 100; // 7700 → 77%
```

### Risques spécifiques au looping

- **Volatilité des prix** : Une chute de 20% du collateral peut déclencher une liquidation
- **Taux variables** : Le borrow APY peut dépasser le supply APY, rendant la position perdante
- **Utilization spike** : Si le marché atteint 100% utilization, impossible de retirer ou le taux explose
- **Oracle manipulation** : Risque atténué par l'utilisation de Chainlink par Aave

### Différences V2 vs V3 à connaître

| Aspect | V2 | V3 |
|--------|-----|-----|
| Contrat principal | `LendingPool` | `Pool` |
| Méthode de dépôt | `deposit()` | `supply()` |
| E-Mode (leverage accru same-asset) | ❌ | ✅ |
| Supply/Borrow caps | ❌ | ✅ |
| Isolation mode | ❌ | ✅ |

---

## Conclusion

Pour construire une application de calcul de looping sur Aave, l'architecture optimale combine :

1. **@aave/contract-helpers + @aave/math-utils** pour les données temps réel et le formatage
2. **Appels directs à Pool.getUserAccountData()** pour le health factor critique
3. **Subgraphs GraphQL** pour l'historique des taux et le backtesting
4. **@bgd-labs/aave-address-book** pour les adresses multi-chain

Les formules de calcul (leverage max, net APY, health factor prévisionnel) permettent de simuler les positions avant exécution. Pour l'exécution réelle des transactions de looping, l'intégration avec des protocoles comme DeFi Saver ou l'utilisation de flash loans optimise drastiquement l'expérience utilisateur en réduisant 45+ transactions à une seule.