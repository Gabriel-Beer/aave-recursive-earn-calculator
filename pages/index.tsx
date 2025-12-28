import { FC } from 'react';
import Calculator from '@/components/Calculator';

const Home: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section */}
        <div className="mb-10 md:mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Simulateur DeFi
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
            AAVE Recursive
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Earn Calculator
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
            Simulateur avance pour strategies de pret recursif sur Aave
          </p>
          <p className="text-slate-400 max-w-xl mx-auto">
            Optimisez vos rendements avec des cycles automatises de depot et emprunt
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="feature-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-purple-300">Simulation</h3>
              </div>
              <p className="text-sm text-slate-400">
                Testez differentes strategies sans risque reel
              </p>
            </div>
            <div className="feature-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-pink-300">Optimisation</h3>
              </div>
              <p className="text-sm text-slate-400">
                Trouvez le meilleur equilibre risque/rendement
              </p>
            </div>
            <div className="feature-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-blue-300">Securite</h3>
              </div>
              <p className="text-sm text-slate-400">
                Analysez les metriques de risque en temps reel
              </p>
            </div>
          </div>

          {/* Calculator Component */}
          <Calculator />

          {/* Footer Info */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Comment ca marche?
                </h3>
                <ol className="text-sm text-slate-300 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">1</span>
                    <span>Entrez le montant initial et les parametres</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">2</span>
                    <span>Le calculateur simule plusieurs cycles recursifs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">3</span>
                    <span>Chaque cycle: depot, emprunt, redepot</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">4</span>
                    <span>Visualisez les rendements et risques potentiels</span>
                  </li>
                </ol>
              </div>
              <div className="card">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Avertissements
                </h3>
                <ul className="text-sm text-slate-300 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-400"></span>
                    <span>Cette simulation est a titre informatif uniquement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-400"></span>
                    <span>Les taux reels peuvent varier</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-400"></span>
                    <span>Il existe toujours un risque de liquidation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-400"></span>
                    <span>Consultez un conseiller avant d&apos;investir</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>AAVE Recursive Earn Calculator - Outil de simulation DeFi</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
