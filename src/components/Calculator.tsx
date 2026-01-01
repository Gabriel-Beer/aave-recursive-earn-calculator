import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { calculateRecursiveCycles } from '@/services/calculator';
import { getReserveData, ASSET_METADATA } from '@/services/aaveService';
import { RecursiveSimulation, ReserveData } from '@/types/aave';
import { useCustomAssets } from '@/hooks/useCustomAssets';
import ResultsDisplay from './ResultsDisplay';
import { CustomAssetsDrawer } from './CustomAssets/CustomAssetsDrawer';
import Tooltip from './Tooltip';

type CalculationMode = 'cycles' | 'healthFactor';

interface CalculatorInputs {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: string;
  targetHealthFactor: string;
  borrowPercentage: string; // 50 to 100
}

const TOOLTIPS = {
  initialAmount: 'Le montant en USD que vous souhaitez deposer initialement sur Aave comme collateral.',
  cycles: 'Nombre de fois que le processus depot/emprunt/redepot sera repete. Plus de cycles = plus de levier mais aussi plus de risque.',
  healthFactor: 'Ratio de securite de votre position. En dessous de 1.0, vous risquez la liquidation. Recommande: > 1.5 pour les debutants.',
  ltv: 'Loan-to-Value: pourcentage maximum que vous pouvez emprunter par rapport a votre collateral.',
  asset: 'La cryptomonnaie que vous utilisez comme collateral et pour emprunter.',
  borrowPercentage: 'Pourcentage de votre collateral que vous allez emprunter a chaque cycle. Limité au LTV maximum de l\'asset. Exemple: si LTV=72%, le max est 72%.',
};

const Calculator: FC = () => {
  const { isCustomSymbol, hasOverride, assets: customAssets } = useCustomAssets();
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('cycles');
  const [inputs, setInputs] = useState<CalculatorInputs>({
    initialAmount: '1000',
    assetSymbol: 'USDC',
    numberOfCycles: '3',
    targetHealthFactor: '1.5',
    borrowPercentage: '80',
  });

  const [results, setResults] = useState<RecursiveSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveRates, setLiveRates] = useState<ReserveData | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Only refresh supported assets after hydration (client-side)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get live assets (always the same on server/client)
  const liveAssets = useMemo(() => {
    return Object.entries(ASSET_METADATA)
      .filter(([symbol]) => symbol !== 'WETH')
      .map(([symbol, meta]) => ({
        symbol,
        name: meta.name,
        category: meta.category,
      }));
  }, []);

  // Group live assets by category
  const assetsByCategory = useMemo(() => {
    const grouped: Record<string, typeof liveAssets> = {};
    liveAssets.forEach(asset => {
      if (!grouped[asset.category]) {
        grouped[asset.category] = [];
      }
      grouped[asset.category].push(asset);
    });
    return grouped;
  }, [liveAssets]);

  // Fetch live rates when asset changes
  const fetchLiveRates = useCallback(async (symbol: string) => {
    setLoadingRates(true);
    try {
      const data = await getReserveData(symbol);
      setLiveRates(data);
    } catch (err) {
      console.error('Failed to fetch rates:', err);
      setLiveRates(null);
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveRates(inputs.assetSymbol);
  }, [inputs.assetSymbol, fetchLiveRates]);

  // Auto-calculate complementary value based on mode
  useEffect(() => {
    if (calculationMode === 'cycles') {
      // When in cycles mode, estimate the resulting health factor
      const cycles = parseInt(inputs.numberOfCycles, 10);
      if (!isNaN(cycles) && cycles >= 1 && cycles <= 10) {
        // Rough estimation: more cycles = lower health factor
        const estimatedHF = Math.max(1.1, 3.0 - (cycles * 0.3));
        setInputs(prev => ({ ...prev, targetHealthFactor: estimatedHF.toFixed(2) }));
      }
    } else {
      // When in health factor mode, estimate the number of cycles
      const hf = parseFloat(inputs.targetHealthFactor);
      if (!isNaN(hf) && hf >= 1.05) {
        // Rough estimation: lower HF = more cycles possible
        const estimatedCycles = Math.min(10, Math.max(1, Math.floor((3.0 - hf) / 0.3) + 1));
        setInputs(prev => ({ ...prev, numberOfCycles: estimatedCycles.toString() }));
      }
    }
  }, [calculationMode]);

  const validateInputs = (): string | null => {
    const amount = parseFloat(inputs.initialAmount);
    if (isNaN(amount) || amount <= 0) {
      return 'Montant initial doit etre positif';
    }

    if (calculationMode === 'cycles') {
      const cycles = parseInt(inputs.numberOfCycles, 10);
      if (isNaN(cycles) || cycles < 1 || cycles > 10) {
        return 'Nombre de cycles doit etre entre 1 et 10';
      }
    } else {
      const hf = parseFloat(inputs.targetHealthFactor);
      if (isNaN(hf) || hf < 1.05) {
        return 'Health Factor doit etre au minimum 1.05';
      }
      if (hf > 10) {
        return 'Health Factor ne peut pas depasser 10';
      }
    }

    // Check if asset exists in live assets or custom assets
    const isValidAsset = liveAssets.some(a => a.symbol === inputs.assetSymbol) ||
                         customAssets.some(a => a.symbol === inputs.assetSymbol);
    if (!isValidAsset) {
      return 'Asset invalide';
    }

    return null;
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModeChange = (mode: CalculationMode) => {
    setCalculationMode(mode);
    setError(null);
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError(null);

      const validationError = validateInputs();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      const simulation = await calculateRecursiveCycles({
        initialAmount: inputs.initialAmount,
        assetSymbol: inputs.assetSymbol,
        numberOfCycles: parseInt(inputs.numberOfCycles, 10),
        targetHealthFactor: parseFloat(inputs.targetHealthFactor),
        borrowPercentage: parseFloat(inputs.borrowPercentage) / 100, // Convert to decimal
        mode: calculationMode,
      });

      setResults(simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom Assets Drawer */}
      <CustomAssetsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Input Section */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Parametres de simulation
          </h2>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Manage custom assets and promotional rates"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Custom Assets
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Mode de calcul
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleModeChange('cycles')}
              className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                calculationMode === 'cycles'
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                <span className="font-medium">Par nombre de cycles</span>
              </div>
              {calculationMode === 'cycles' && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('healthFactor')}
              className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                calculationMode === 'healthFactor'
                  ? 'border-pink-500 bg-pink-500/10 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="font-medium">Par Health Factor cible</span>
              </div>
              {calculationMode === 'healthFactor' && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {calculationMode === 'cycles'
              ? 'Definissez le nombre de cycles et le Health Factor sera calcule automatiquement.'
              : 'Definissez le Health Factor cible et le nombre de cycles sera optimise automatiquement.'}
          </p>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Initial Amount */}
          <div className="input-group">
            <label htmlFor="initial-amount" className="input-label">
              <Tooltip content={TOOLTIPS.initialAmount}>
                Montant initial (USD)
              </Tooltip>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                id="initial-amount"
                type="number"
                className="input-field pl-8"
                value={inputs.initialAmount}
                onChange={(e) => handleInputChange('initialAmount', e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>
          </div>

          {/* Asset Selection */}
          <div className="input-group">
            <label htmlFor="asset-select" className="input-label">
              <Tooltip content={TOOLTIPS.asset}>
                Asset
              </Tooltip>
            </label>
            <select
              id="asset-select"
              className="input-field"
              value={inputs.assetSymbol}
              onChange={(e) => handleInputChange('assetSymbol', e.target.value)}
              suppressHydrationWarning
            >
              {/* Custom Assets at top if any exist (only rendered after hydration) */}
              {isHydrated && customAssets.length > 0 && (
                <optgroup label="🟣 Custom Assets">
                  {customAssets.map((asset) => (
                    <option key={asset.id} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Live Assets (always rendered consistently) */}
              {Object.entries(assetsByCategory).map(([category, assets]) => (
                <optgroup key={category} label={category === 'LSD' ? 'Liquid Staking' : category}>
                  {assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Live Rates Display */}
          <div className="input-group">
            <label className="input-label">Taux en direct (Aave V3)</label>
            {loadingRates ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement des taux...
              </div>
            ) : liveRates ? (
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="text-center p-2 bg-green-500/10 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Supply APY</div>
                  <div className="text-lg font-bold text-green-400">
                    {(parseFloat(liveRates.liquidityRate) * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Borrow APY</div>
                  <div className="text-lg font-bold text-red-400">
                    {(parseFloat(liveRates.variableBorrowRate) * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">LTV Max</div>
                  <div className="text-lg font-bold text-purple-400">
                    {(parseFloat(liveRates.ltv) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Liq. Threshold</div>
                  <div className="text-lg font-bold text-blue-400">
                    {(parseFloat(liveRates.liquidationThreshold) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-3">
                Impossible de charger les taux
              </div>
            )}

            {/* Data Source Indicator */}
            {liveRates && (
              <div className="mt-3 text-xs flex items-center gap-2">
                {isCustomSymbol(inputs.assetSymbol) ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-purple-300">Asset personnalisé (données manuelles)</span>
                  </>
                ) : hasOverride(inputs.assetSymbol) ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-yellow-300">Taux personnalisés appliqués</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-green-300">Taux en direct depuis Aave V3</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Borrow Percentage - Locked at LTV */}
          <div className="input-group md:col-span-2">
            <label htmlFor="borrow-percentage" className="input-label">
              <Tooltip content={TOOLTIPS.borrowPercentage}>
                % du collateral à emprunter
              </Tooltip>
              <span className="ml-2 text-sm font-bold text-purple-400">
                {inputs.borrowPercentage}%
                {liveRates && ` / ${(parseFloat(liveRates.ltv) * 100).toFixed(0)}% (LTV Max)`}
              </span>
            </label>
            <div className="relative mt-2">
              <input
                id="borrow-percentage"
                type="range"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                value={inputs.borrowPercentage}
                onChange={(e) => {
                  const value = Math.min(parseFloat(e.target.value), liveRates ? parseFloat(liveRates.ltv) * 100 : 100);
                  handleInputChange('borrowPercentage', value.toString());
                }}
                min="10"
                max={liveRates ? Math.max(parseFloat(liveRates.ltv) * 100, 50).toString() : "100"}
                step="5"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10% (Prudent)</span>
                <span>{liveRates ? `${(parseFloat(liveRates.ltv) * 50).toFixed(0)}%` : '50%'}</span>
                <span>{liveRates ? `${(parseFloat(liveRates.ltv) * 100).toFixed(0)}% (LTV Max)` : '100% (Max)'}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {[10, 25, 50, 75].map((pct) => {
                const maxBorrow = liveRates ? parseFloat(liveRates.ltv) * 100 : 100;
                const isDisabled = pct > maxBorrow;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleInputChange('borrowPercentage', Math.min(pct, maxBorrow).toString())}
                    disabled={isDisabled}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                      parseInt(inputs.borrowPercentage) === pct
                        ? 'bg-purple-500 text-white'
                        : isDisabled
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {parseInt(inputs.borrowPercentage) <= 70
                ? '🛡️ Prudent - Bonne protection contre les variations de prix'
                : parseInt(inputs.borrowPercentage) <= 85
                ? '⚖️ Modere - Equilibre entre rendement et securite'
                : '⚠️ Agressif - Rendement maximum mais risque de liquidation accru'}
            </p>
          </div>

          {/* Number of Cycles - Primary in cycles mode */}
          <div className={`input-group ${calculationMode === 'healthFactor' ? 'opacity-60' : ''}`}>
            <label htmlFor="num-cycles" className="input-label">
              <Tooltip content={TOOLTIPS.cycles}>
                Nombre de cycles
              </Tooltip>
              {calculationMode === 'healthFactor' && (
                <span className="ml-2 text-xs text-slate-500">(auto)</span>
              )}
            </label>
            <input
              id="num-cycles"
              type="number"
              className="input-field"
              value={inputs.numberOfCycles}
              onChange={(e) => handleInputChange('numberOfCycles', e.target.value)}
              placeholder="3"
              min="1"
              max="10"
              disabled={calculationMode === 'healthFactor'}
            />
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => calculationMode === 'cycles' && handleInputChange('numberOfCycles', num.toString())}
                  disabled={calculationMode === 'healthFactor'}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                    parseInt(inputs.numberOfCycles) === num
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  } ${calculationMode === 'healthFactor' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Target Health Factor - Primary in healthFactor mode */}
          <div className={`input-group ${calculationMode === 'cycles' ? 'opacity-60' : ''}`}>
            <label htmlFor="target-hf" className="input-label">
              <Tooltip content={TOOLTIPS.healthFactor}>
                Health Factor cible
              </Tooltip>
              {calculationMode === 'cycles' && (
                <span className="ml-2 text-xs text-slate-500">(auto)</span>
              )}
            </label>
            <input
              id="target-hf"
              type="number"
              className="input-field"
              value={inputs.targetHealthFactor}
              onChange={(e) => handleInputChange('targetHealthFactor', e.target.value)}
              placeholder="1.5"
              step="0.1"
              min="1.05"
              max="10"
              disabled={calculationMode === 'cycles'}
            />
            <div className="mt-2 flex items-center gap-1">
              {[1.2, 1.5, 2.0, 2.5, 3.0].map((hf) => (
                <button
                  key={hf}
                  type="button"
                  onClick={() => calculationMode === 'healthFactor' && handleInputChange('targetHealthFactor', hf.toString())}
                  disabled={calculationMode === 'cycles'}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
                    parseFloat(inputs.targetHealthFactor) === hf
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  } ${calculationMode === 'cycles' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {hf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="btn-primary mt-8 w-full py-4 text-lg font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calcul en cours...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="12" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
              Calculer la simulation
            </span>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card-error animate-shake">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-red-300">Erreur de validation</h4>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && <ResultsDisplay results={results} />}
    </div>
  );
};

export default Calculator;
