import type { AppProps } from 'next/app';
import { FC, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/globals.css';

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-950">
        <Component {...pageProps} />
      </div>
    </QueryClientProvider>
  );
};

export default MyApp;
