'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const inter = Inter({ subsets: ['latin'] });

// Simple X Layer testnet configuration
const xLayerTestnet = {
  id: 195,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://endpoints.omniatech.io/v1/xlayer/testnet/public'] },
  },
  blockExplorers: {
    default: { name: 'X Layer Explorer', url: 'https://explorer.xlayer-testnet.tech' },
  },
  testnet: true,
} as const;

// Simple wagmi configuration
const config = createConfig({
  chains: [mainnet, xLayerTestnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [xLayerTestnet.id]: http(),
  },
});

// Create query client
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
