import { FC, useState } from 'react';
import { calculateRecursiveCycles } from '@/services/calculator';
import { RecursiveSimulation } from '@/types/aave';
import ResultsDisplay from './ResultsDisplay';

interface CalculatorInputs {
  initialAmount: string;
  assetSymbol: string;
  numberOfCycles: string;
  targetHealthFactor: string;
}

const Calculator: FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    initialAmount: '1000',
    assetSymbol: 'USDC',
    numberOfCycles: '3',
    targetHealthFactor: '2.0',
  });

  const [results, setResults] = useState<RecursiveSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const VALID_ASSETS = ['USDC', 'DAI', 'USDT', 'ETH'];

  const validateInputs = (): string | null => {
    const amount = parseFloat(inputs.initialAmount);
    if (isNaN(amount) || amount <= 0) {
      return 'Montant initial doit être positif';
    }

    const cycles = parseInt(inputs.numberOfCycles, 10);
    if (isNaN(cycles) || cycles < 1 || cycles > 10) {
      return 'Nombre de cycles doit être entre 1 et 10';
    }

    const hf = parseFloat(inputs.targetHealthFactor);
    if (isNaN(hf) || hf < 1.05) {
      return 'Health Factor doit être au minimum 1.05';
    }

    if (!VALID_ASSETS.includes(inputs.assetSymbol)) {
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
      });

      setResults(simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Paramètres de simulation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="initial-amount" className="block text-sm font-medium mb-2">Montant initial (USD)</label>
            <input
              id="initial-amount"
              type="number"
              className="input-field"
              value={inputs.initialAmount}
              onChange={(e) => handleInputChange('initialAmount', e.target.value)}
              placeholder="1000"
            />
          </div>

          <div>
            <label htmlFor="num-cycles" className="block text-sm font-medium mb-2">Nombre de cycles</label>
            <input
              id="num-cycles"
              type="number"
              className="input-field"
              value={inputs.numberOfCycles}
              onChange={(e) => handleInputChange('numberOfCycles', e.target.value)}
              placeholder="3"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label htmlFor="asset-select" className="block text-sm font-medium mb-2">Asset</label>
            <select
              id="asset-select"
              className="input-field"
              value={inputs.assetSymbol}
              onChange={(e) => handleInputChange('assetSymbol', e.target.value)}
            >
              <option>USDC</option>
              <option>DAI</option>
              <option>USDT</option>
              <option>ETH</option>
            </select>
          </div>

          <div>
            <label htmlFor="target-hf" className="block text-sm font-medium mb-2">Health Factor cible</label>
            <input
              id="target-hf"
              type="number"
              className="input-field"
              value={inputs.targetHealthFactor}
              onChange={(e) => handleInputChange('targetHealthFactor', e.target.value)}
              placeholder="2.0"
              step="0.1"
              min="1.05"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? 'Calcul en cours...' : 'Calculer'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-900/20 border-red-700/50">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {results && <ResultsDisplay results={results} />}
    </div>
  );
};

export default Calculator;
