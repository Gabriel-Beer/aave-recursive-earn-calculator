# Plan Complet - Calculateur de Prêt Récursif Aave

## Vue d'ensemble du projet

Application Next.js/React permettant de calculer et simuler des stratégies de prêt récursif sur Aave (looping/leverage farming).

### Concept de base
```
Dépôt initial → Emprunt → Redépôt → Réemprunt → ... (N itérations)
```

**Exemple concret:**
- Dépôt: 10 ETH (valeur: $20,000)
- LTV ETH: 80%
- Itération 1: Emprunt 80% = $16,000 → Redépôt
- Itération 2: Emprunt 80% de $16,000 = $12,800 → Redépôt
- Itération 3: Emprunt 80% de $12,800 = $10,240 → Redépôt
- ...
- Total exposé: ~$100,000 (5x leverage)

---

## Architecture technique

### Stack technologique
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React hooks (useState, useReducer)
- **Graphiques:** Recharts ou Chart.js
- **Data fetching:** TanStack Query (react-query)
- **API Aave:** Aave V3 Subgraph (The Graph) ou API directe

---

## Structure du projet

```
aave-recursive-earn-calculator/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── aave/
│   │           └── route.ts          # API route pour les données Aave
│   │
│   ├── components/
│   │   ├── ui/                       # Composants shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── calculator/
│   │   │   ├── Calculator.tsx        # Composant principal
│   │   │   ├── AssetSelector.tsx     # Sélection crypto avec badges (collatéral/empruntable)
│   │   │   ├── AssetBadges.tsx       # Badges: "Collatéral ✓", "Empruntable ✓", "Gelé ⚠"
│   │   │   ├── AmountInput.tsx       # Montant du dépôt initial
│   │   │   ├── IterationSlider.tsx   # Nombre de boucles
│   │   │   ├── StrategySelector.tsx  # Type de stratégie
│   │   │   └── NetworkSelector.tsx   # Ethereum, Polygon, Arbitrum, etc.
│   │   │
│   │   ├── results/
│   │   │   ├── ResultsPanel.tsx      # Panneau des résultats
│   │   │   ├── IterationTable.tsx    # Tableau détaillé par itération
│   │   │   ├── SummaryCards.tsx      # Cartes résumé (APY, total, etc.)
│   │   │   └── ProfitChart.tsx       # Graphique des gains
│   │   │
│   │   ├── risk/
│   │   │   ├── RiskIndicator.tsx     # Indicateur de risque (jauge)
│   │   │   ├── LiquidationWarning.tsx# Alerte liquidation
│   │   │   ├── HealthFactor.tsx      # Affichage Health Factor
│   │   │   └── StressTest.tsx        # Simulation chute des prix
│   │   │
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ThemeToggle.tsx
│   │
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── recursiveLending.ts   # Logique de calcul récursif
│   │   │   ├── interestRates.ts      # Calcul des intérêts
│   │   │   ├── liquidation.ts        # Calcul seuil liquidation
│   │   │   └── apr-apy.ts            # Conversion APR/APY
│   │   │
│   │   ├── aave/
│   │   │   ├── client.ts             # Client API Aave
│   │   │   ├── subgraph.ts           # Queries GraphQL
│   │   │   ├── constants.ts          # Adresses contrats, etc.
│   │   │   └── types.ts              # Types Aave
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts         # Formatage nombres/devises
│   │       └── validators.ts         # Validation inputs
│   │
│   ├── hooks/
│   │   ├── useAaveData.ts            # Hook données Aave
│   │   ├── useCalculation.ts         # Hook calcul récursif
│   │   └── useLocalStorage.ts        # Persistance paramètres
│   │
│   ├── types/
│   │   ├── calculator.ts             # Types du calculateur
│   │   ├── aave.ts                   # Types protocole Aave
│   │   └── index.ts
│   │
│   └── constants/
│       ├── assets.ts                 # Liste des cryptos supportées
│       ├── networks.ts               # Réseaux supportés
│       └── defaults.ts               # Valeurs par défaut
│
├── public/
│   └── assets/
│       └── tokens/                   # Icônes des tokens
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Fonctionnalités détaillées

### 1. Calculateur de base
- [ ] Sélection de l'actif à déposer (avec prix, LTV, APY affichés)
- [ ] Sélection de l'actif à emprunter (avec APY emprunt affiché)
- [ ] Montant du dépôt initial
- [ ] Nombre d'itérations (1 à 20+)
- [ ] Réseau sélectionnable (optionnel, Ethereum par défaut)

### 2. Paramètres Aave (récupérés en temps réel)
- [ ] **usageAsCollateralEnabled** - Vérifier si l'actif peut être utilisé comme collatéral
- [ ] **borrowingEnabled** - Vérifier si l'actif peut être emprunté
- [ ] **isActive / isFrozen** - Vérifier si le marché est actif
- [ ] LTV (Loan-to-Value) par actif
- [ ] Liquidation Threshold
- [ ] APY de dépôt (Supply APY)
- [ ] APY d'emprunt (Borrow APY variable/stable)
- [ ] Rewards AAVE (si applicable)
- [ ] Prix en temps réel des actifs

### 3. Résultats calculés
- [ ] **Total déposé** après toutes les itérations
- [ ] **Total emprunté** après toutes les itérations
- [ ] **APY net** (rendement dépôt - coût emprunt)
- [ ] **Gains quotidiens/mensuels/annuels** estimés
- [ ] **Health Factor** final
- [ ] **Leverage effectif** (multiplicateur)
- [ ] **Tableau détaillé** de chaque itération

### 4. Gestion des risques
- [ ] **Health Factor** en temps réel
- [ ] **Prix de liquidation** calculé
- [ ] **Stress test**: simulation si le prix chute de X%
- [ ] **Alerte visuelle** si risque élevé (HF < 1.5)
- [ ] **Recommandations** de sécurité

### 5. Fonctionnalités avancées
- [ ] Comparaison de stratégies (côte à côte)
- [ ] Export des résultats (PDF/CSV)
- [ ] Sauvegarde des configurations
- [ ] Mode sombre/clair
- [ ] Calcul des frais de gas estimés
- [ ] Support multi-actifs (dépôt ETH, emprunt USDC)

---

## Formules de calcul

### Calcul récursif
```typescript
function calculateRecursiveLending(
  initialDeposit: number,
  ltv: number,
  iterations: number
): { totalDeposited: number; totalBorrowed: number } {
  let totalDeposited = initialDeposit;
  let totalBorrowed = 0;
  let currentDeposit = initialDeposit;

  for (let i = 0; i < iterations; i++) {
    const borrowAmount = currentDeposit * ltv;
    totalBorrowed += borrowAmount;
    totalDeposited += borrowAmount;
    currentDeposit = borrowAmount;
  }

  return { totalDeposited, totalBorrowed };
}
```

### APY Net
```typescript
const netAPY = (totalDeposited * supplyAPY - totalBorrowed * borrowAPY) / initialDeposit;
```

### Health Factor
```typescript
const healthFactor = (totalDeposited * liquidationThreshold) / totalBorrowed;
```

### Prix de liquidation
```typescript
const liquidationPrice = currentPrice * (1 - (healthFactor - 1) / healthFactor);
```

---

## Plan d'implémentation

### Phase 1: Setup et structure (Étape 1-3)
1. Initialiser le projet Next.js 14 avec TypeScript
2. Configurer Tailwind CSS et shadcn/ui
3. Créer la structure de dossiers

### Phase 2: Logique de calcul (Étape 4-6)
4. Implémenter les fonctions de calcul récursif
5. Créer les types TypeScript
6. Ajouter les tests unitaires des calculs

### Phase 3: Interface utilisateur (Étape 7-11)
7. Créer les composants UI de base (inputs, selects, sliders)
8. Implémenter le formulaire du calculateur
9. Créer le panneau de résultats
10. Ajouter les graphiques
11. Implémenter les indicateurs de risque

### Phase 4: Intégration Aave (Étape 12-14)
12. Configurer le client API/Subgraph Aave
13. Créer les hooks de data fetching
14. Connecter les données réelles aux calculs

### Phase 5: Finitions (Étape 15-17)
15. Ajouter le mode sombre
16. Optimiser les performances
17. Tests end-to-end et déploiement

---

## Réseaux et actifs supportés

### Réseaux
| Réseau | Chain ID | Subgraph |
|--------|----------|----------|
| Ethereum | 1 | Aave V3 Ethereum |
| Polygon | 137 | Aave V3 Polygon |
| Arbitrum | 42161 | Aave V3 Arbitrum |
| Optimism | 10 | Aave V3 Optimism |
| Avalanche | 43114 | Aave V3 Avalanche |

### Actifs principaux (Aave V3 Ethereum)
| Actif | Collatéral | Empruntable | LTV | Liquidation |
|-------|:----------:|:-----------:|-----|-------------|
| ETH/WETH | ✅ | ✅ | 80% | 82.5% |
| WBTC | ✅ | ✅ | 70% | 75% |
| USDC | ✅ | ✅ | 77% | 80% |
| DAI | ✅ | ✅ | 77% | 80% |
| USDT | ✅ | ✅ | 77% | 80% |
| LINK | ✅ | ✅ | 68% | 73% |
| AAVE | ✅ | ❌ | 66% | 73% |
| GHO | ❌ | ✅ | 0% | 0% |

> **Note**: Les paramètres varient selon le réseau. Toujours vérifier `usageAsCollateralEnabled` et `borrowingEnabled` via l'API.

---

## API Aave - Endpoints

### The Graph (Subgraph)
```graphql
query GetReserveData {
  reserves(where: { underlyingAsset: "0x..." }) {
    id
    symbol
    name
    decimals

    # Flags de disponibilité (IMPORTANT)
    usageAsCollateralEnabled    # Peut être utilisé comme collatéral?
    borrowingEnabled            # Peut être emprunté?
    isActive                    # Marché actif?
    isFrozen                    # Marché gelé?

    # Paramètres de risque
    baseLTVasCollateral         # LTV max (ex: 8000 = 80%)
    reserveLiquidationThreshold # Seuil liquidation (ex: 8250 = 82.5%)
    reserveLiquidationBonus     # Bonus liquidateur

    # Taux d'intérêt
    liquidityRate               # APY dépôt (ray: 27 décimales)
    variableBorrowRate          # APY emprunt variable
    stableBorrowRate            # APY emprunt stable

    # Données marché
    priceInUsd
    totalLiquidity
    availableLiquidity
  }
}
```

### Validation des actifs
```typescript
interface AssetValidation {
  canBeCollateral: boolean;      // usageAsCollateralEnabled
  canBeBorrowed: boolean;        // borrowingEnabled
  isMarketActive: boolean;       // isActive && !isFrozen
  maxLTV: number;                // baseLTVasCollateral / 10000
  liquidationThreshold: number;  // reserveLiquidationThreshold / 10000
}

// Filtrer uniquement les actifs utilisables pour le looping
const validCollateralAssets = reserves.filter(r =>
  r.usageAsCollateralEnabled &&
  r.isActive &&
  !r.isFrozen &&
  r.baseLTVasCollateral > 0
);
```

---

## Estimation du projet

### Complexité: Moyenne-Haute
### Fichiers à créer: ~35-40
### Composants React: ~20

---

## Questions pour validation

1. **Mode en ligne vs hors ligne?**
   - Données Aave en temps réel (API) ou valeurs par défaut modifiables?

2. **Authentification wallet?**
   - Simple calculateur ou connexion wallet pour voir ses positions?

3. **Priorité des réseaux?**
   - Commencer par Ethereum seul ou multi-chain dès le départ?

4. **Style visuel?**
   - Minimaliste, style DeFi sombre, ou autre préférence?

---

Voulez-vous que je commence l'implémentation avec ce plan?
