import type { AppProps } from 'next/app';
import { FC } from 'react';
import { WagmiProvider, createConfig, http, sepolia, mainnet } from 'wagmi';
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
  return (
    <WagmiProvider config={config}>
      <ConnectKitProvider>
        <div className="min-h-screen bg-gray-950">
          <Component {...pageProps} />
        </div>
      </ConnectKitProvider>
    </WagmiProvider>
  );
};

export default MyApp;
