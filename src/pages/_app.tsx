import type { AppProps } from 'next/app';
import { FC, ReactNode } from 'react';
import { WagmiConfig, createConfig, sepolia, mainnet } from 'wagmi';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { publicProvider } from 'wagmi/providers/public';
import '../styles/globals.css';

const config = createConfig(
  getDefaultConfig({
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'AAVE Calculator',
    alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || '',
    chains: [mainnet, sepolia],
  })
);

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <div className="min-h-screen bg-gray-950">
          <Component {...pageProps} />
        </div>
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

export default MyApp;
