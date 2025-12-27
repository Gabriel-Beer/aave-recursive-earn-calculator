import { FC } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

const WalletConnect: FC = () => {
  const { address, isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-slate-700/50 bg-slate-950/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AAVE Recursive Calculator
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="hidden sm:block text-sm text-slate-400">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
};

export default WalletConnect;
