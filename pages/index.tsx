import { FC } from 'react';
import WalletConnect from '@/components/WalletConnect';
import Calculator from '@/components/Calculator';
import { useAccount } from 'wagmi';

const Home: FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <WalletConnect />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            AAVE Recursive Earn Calculator
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Simulateur avancé pour stratégies de prêt récursif sur Aave
          </p>
          <p className="text-slate-400">
            Optimisez vos rendements avec des cycles automatisés de dépôt et emprunt
          </p>
        </div>

        {/* Main Content */}
        {!isConnected ? (
          // Disconnected State
          <div className="max-w-2xl mx-auto card text-center">
            <h2 className="text-2xl font-bold mb-4">Connectez votre portefeuille</h2>
            <p className="text-slate-300 mb-6">
              Vous devez connecter votre portefeuille Web3 pour utiliser le calculateur.
              Cliquez sur le bouton "Connect Wallet" en haut à droite pour commencer.
            </p>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 <strong>Conseil:</strong> Utilisez MetaMask, WalletConnect ou une autre
                extension Web3 compatible
              </p>
            </div>
          </div>
        ) : (
          // Connected State
          <div className="max-w-6xl mx-auto">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <h3 className="font-semibold text-purple-300 mb-2">📊 Simulation</h3>
                <p className="text-sm text-slate-400">
                  Testez différentes stratégies sans risque réel
                </p>
              </div>
              <div className="card">
                <h3 className="font-semibold text-pink-300 mb-2">⚡ Optimisation</h3>
                <p className="text-sm text-slate-400">
                  Trouvez le meilleur équilibre risque/rendement
                </p>
              </div>
              <div className="card">
                <h3 className="font-semibold text-blue-300 mb-2">🛡️ Sécurité</h3>
                <p className="text-sm text-slate-400">
                  Analysez les métriques de risque en temps réel
                </p>
              </div>
            </div>

            {/* Calculator Component */}
            <div>
              <Calculator />
            </div>

            {/* Footer Info */}
            <div className="mt-12 pt-8 border-t border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">❓ Comment ça marche?</h3>
                  <ol className="text-sm text-slate-300 space-y-2">
                    <li>1. Entrez le montant initial et les paramètres</li>
                    <li>2. Le calculateur simule plusieurs cycles récursifs</li>
                    <li>3. Chaque cycle: dépôt → emprunt → redépôt</li>
                    <li>4. Visualisez les rendements et risques potentiels</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">⚠️ Avertissements</h3>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Cette simulation est à titre informatif uniquement</li>
                    <li>• Les taux réels peuvent varier</li>
                    <li>• Il existe toujours un risque de liquidation</li>
                    <li>• Consultez un conseiller avant d'investir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
