import { FC } from 'react';
import { RecursiveSimulation } from '@/types/aave';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import Tooltip from './Tooltip';

interface ResultsDisplayProps {
  results: RecursiveSimulation;
}

const TOOLTIPS = {
  healthFactor: 'Ratio entre votre collateral et vos emprunts. Plus il est eleve, plus vous etes en securite.',
  liquidationPrice: 'Prix auquel votre position sera automatiquement liquidee pour rembourser les prets.',
  riskLevel: 'Evaluation globale du risque de votre strategie recursive.',
  netProfit: 'Gains nets apres deduction des frais d\'emprunt et des interets payes.',
  leverage: 'Facteur multiplicateur de votre exposition par rapport au capital initial.',
};

const ResultsDisplay: FC<ResultsDisplayProps> = ({ results }) => {
  const chartData = results.progressionByRound.map((round) => ({
    cycle: `Cycle ${round.round}`,
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

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-500/10 border-green-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'Faible';
      case 'MEDIUM':
        return 'Modere';
      case 'HIGH':
        return 'Eleve';
      case 'CRITICAL':
        return 'Critique';
      default:
        return risk;
    }
  };

  // Use values from calculation
  const initialAmount = parseFloat(results.initialAmount);
  const finalAmount = parseFloat(results.finalAmount);
  const totalBorrowed = parseFloat(results.totalBorrowed);
  const leverage = parseFloat(results.leverage);
  const netAPY = parseFloat(results.netAPY);
  const supplyAPY = parseFloat(results.supplyAPY);
  const borrowAPY = parseFloat(results.borrowAPY);
  const maxPriceDrop = parseFloat(results.riskMetrics.maxPriceDropPercent);
  const healthFactor = parseFloat(results.riskMetrics.healthFactor) || 0;

  return (
    <div className="space-y-6">
      {/* Risk Alert Banner */}
      {(results.riskMetrics.riskLevel === 'HIGH' || results.riskMetrics.riskLevel === 'CRITICAL') && (
        <div className={`card-warning animate-pulse-slow ${
          results.riskMetrics.riskLevel === 'CRITICAL' ? 'border-red-500 bg-red-900/30' : 'border-orange-500 bg-orange-900/30'
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className={`w-8 h-8 ${results.riskMetrics.riskLevel === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${results.riskMetrics.riskLevel === 'CRITICAL' ? 'text-red-300' : 'text-orange-300'}`}>
                {results.riskMetrics.riskLevel === 'CRITICAL' ? 'ATTENTION: Risque critique de liquidation!' : 'Avertissement: Risque eleve'}
              </h3>
              <p className="text-slate-300 mt-1">
                {results.riskMetrics.riskLevel === 'CRITICAL'
                  ? `Votre Health Factor de ${results.riskMetrics.healthFactor} est dangereusement proche de 1.0. Une petite variation du marche pourrait declencher une liquidation.`
                  : `Votre Health Factor de ${results.riskMetrics.healthFactor} presente un risque eleve. Considerez une strategie plus conservatrice.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Gains & Risks Overview */}
      <div className="card-elevated">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Resume de la strategie
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-icon bg-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">APY Net</p>
              <p className={`text-xl font-bold ${netAPY >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netAPY >= 0 ? '+' : ''}{netAPY.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">Supply {supplyAPY.toFixed(2)}% - Borrow {borrowAPY.toFixed(2)}%</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">
                <Tooltip content={TOOLTIPS.leverage}>
                  Effet de levier
                </Tooltip>
              </p>
              <p className="text-xl font-bold text-purple-400">{leverage.toFixed(2)}x</p>
              <p className="text-xs text-slate-500">{results.cycles} cycles</p>
            </div>
          </div>

          <div className="stat-card">
            <div className={`stat-icon ${getRiskBgColor(results.riskMetrics.riskLevel)}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${getRiskColor(results.riskMetrics.riskLevel)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">
                <Tooltip content={TOOLTIPS.healthFactor}>
                  Health Factor
                </Tooltip>
              </p>
              <p className={`text-xl font-bold ${getRiskColor(results.riskMetrics.riskLevel)}`}>
                {results.riskMetrics.healthFactor}
              </p>
              <p className={`text-xs ${getRiskColor(results.riskMetrics.riskLevel)}`}>
                {getRiskLabel(results.riskMetrics.riskLevel)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className={`stat-icon ${maxPriceDrop < 20 ? 'bg-red-500/20' : maxPriceDrop < 40 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${maxPriceDrop < 20 ? 'text-red-400' : maxPriceDrop < 40 ? 'text-yellow-400' : 'text-green-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22V8M5 12l7-7 7 7"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">
                <Tooltip content="Chute de prix maximale avant liquidation. Plus ce % est eleve, plus vous etes en securite.">
                  Marge de securite
                </Tooltip>
              </p>
              <p className={`text-xl font-bold ${maxPriceDrop < 20 ? 'text-red-400' : maxPriceDrop < 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                {maxPriceDrop.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">avant liquidation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Montant initial</p>
          </div>
          <p className="text-2xl font-bold">${results.initialAmount}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Montant final</p>
          </div>
          <p className="text-2xl font-bold text-green-400">${results.finalAmount}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Interets gagnes</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">${results.totalInterestEarned}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Total emprunte</p>
          </div>
          <p className="text-2xl font-bold text-pink-400">${results.totalBorrowed}</p>
        </div>
      </div>

      {/* Warning Messages */}
      {results.riskMetrics.warningMessages.length > 0 && (
        <div className={`card border-2 ${getRiskBgColor(results.riskMetrics.riskLevel)}`}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Analyse du risque
          </h3>
          <ul className="space-y-2">
            {results.riskMetrics.warningMessages.map((msg, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1 flex-shrink-0">
                  {msg.includes('DANGER') || msg.includes('WARNING') ? (
                    <span className="block w-2 h-2 rounded-full bg-red-400"></span>
                  ) : msg.includes('info') ? (
                    <span className="block w-2 h-2 rounded-full bg-yellow-400"></span>
                  ) : (
                    <span className="block w-2 h-2 rounded-full bg-green-400"></span>
                  )}
                </span>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progression Chart */}
      <div className="card-elevated">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Progression par cycle
        </h3>
        <div className="h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollateral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
              <XAxis
                dataKey="cycle"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickFormatter={(value) => `$${value}`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: '#cbd5e1', padding: '2px 0' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="collateral"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#colorCollateral)"
                name="Collateral"
              />
              <Area
                type="monotone"
                dataKey="borrowed"
                stroke="#f472b6"
                strokeWidth={2}
                fill="url(#colorBorrowed)"
                name="Emprunte"
              />
              <Area
                type="monotone"
                dataKey="interest"
                stroke="#4ade80"
                strokeWidth={2}
                fill="url(#colorInterest)"
                name="Interets cumules"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Progression Table */}
      <div className="card-elevated overflow-hidden">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Details par cycle
        </h3>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-6 py-4 text-left text-slate-400 font-semibold">Cycle</th>
                <th className="px-6 py-4 text-right text-slate-400 font-semibold">Collateral</th>
                <th className="px-6 py-4 text-right text-slate-400 font-semibold">Emprunte</th>
                <th className="px-6 py-4 text-right text-slate-400 font-semibold">Health Factor</th>
                <th className="px-6 py-4 text-right text-slate-400 font-semibold">Interets cumules</th>
              </tr>
            </thead>
            <tbody>
              {results.progressionByRound.map((round, index) => {
                const hf = parseFloat(round.healthFactor);
                const hfColor = hf < 1.5 ? 'text-red-400' : hf < 2 ? 'text-yellow-400' : 'text-green-400';

                return (
                  <tr
                    key={round.round}
                    className={`border-b border-slate-700/50 transition-colors hover:bg-slate-700/30 ${
                      index === results.progressionByRound.length - 1 ? 'bg-purple-500/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">
                          {round.round}
                        </span>
                        {index === results.progressionByRound.length - 1 && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Final</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${round.collateralAmount}</td>
                    <td className="px-6 py-4 text-right text-pink-400">${round.borrowAmount}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${hfColor}`}>{round.healthFactor}</td>
                    <td className="px-6 py-4 text-right text-green-400">${round.cumulativeInterest}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
