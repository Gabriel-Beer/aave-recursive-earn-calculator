import type { AppProps } from 'next/app';
import { FC, useMemo } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import '../styles/globals.css';

const config = createConfig(
  getDefaultConfig({
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'AAVE Calculator',
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'demo',
    chains: [mainnet, sepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  })
);

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <div className="min-h-screen bg-gray-950">
            <Component {...pageProps} />
          </div>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default MyApp;
