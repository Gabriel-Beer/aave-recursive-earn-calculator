import { FC } from 'react';
import { formatEther } from 'ethers';
import { RecursiveSimulation, RiskMetrics } from '@/types/aave';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResultsDisplayProps {
  results: RecursiveSimulation;
}

const ResultsDisplay: FC<ResultsDisplayProps> = ({ results }) => {
  const chartData = results.progressionByRound.map((round) => ({
    cycle: round.round,
    collateral: parseFloat(round.collateralAmount),
    borrowed: parseFloat(round.borrowAmount),
    interest: parseFloat(round.cumulativeInterest),
  }));

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-orange-400';
      case 'CRITICAL':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-slate-400 mb-2">Montant initial</p>
          <p className="text-2xl font-bold">${results.initialAmount}</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-2">Montant final</p>
          <p className="text-2xl font-bold text-green-400">${results.finalAmount}</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-2">Intérêts gagnés</p>
          <p className="text-2xl font-bold text-purple-400">${results.totalInterestEarned}</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-400 mb-2">Total emprunté</p>
          <p className="text-2xl font-bold text-pink-400">${results.totalBorrowed}</p>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Métriques de risque</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Health Factor</p>
            <p className="text-2xl font-bold">{results.riskMetrics.healthFactor}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Prix de liquidation</p>
            <p className="text-2xl font-bold">${results.riskMetrics.liquidationPrice}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Niveau de risque</p>
            <p className={`text-2xl font-bold ${getRiskColor(results.riskMetrics.riskLevel)}`}>
              {results.riskMetrics.riskLevel}
            </p>
          </div>
        </div>

        {results.riskMetrics.warningMessages.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-sm font-medium text-yellow-300 mb-2">Avertissements:</p>
            <ul className="text-sm text-yellow-200 space-y-1">
              {results.riskMetrics.warningMessages.map((msg, idx) => (
                <li key={idx}>• {msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Progression Chart */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Progression par cycle</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="cycle" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="collateral" stroke="#a78bfa" name="Collateral" />
            <Line type="monotone" dataKey="borrowed" stroke="#f472b6" name="Emprunté" />
            <Line type="monotone" dataKey="interest" stroke="#4ade80" name="Intérêts cumulés" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Progression Table */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Détails par cycle</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-2 text-left text-slate-400">Cycle</th>
                <th className="px-4 py-2 text-right text-slate-400">Collateral</th>
                <th className="px-4 py-2 text-right text-slate-400">Emprunté</th>
                <th className="px-4 py-2 text-right text-slate-400">Health Factor</th>
                <th className="px-4 py-2 text-right text-slate-400">Intérêts cumulés</th>
              </tr>
            </thead>
            <tbody>
              {results.progressionByRound.map((round) => (
                <tr key={round.round} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">{round.round}</td>
                  <td className="px-4 py-3 text-right">${round.collateralAmount}</td>
                  <td className="px-4 py-3 text-right">${round.borrowAmount}</td>
                  <td className="px-4 py-3 text-right">{round.healthFactor}</td>
                  <td className="px-4 py-3 text-right text-green-400">${round.cumulativeInterest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
