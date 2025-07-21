'use client';

import { SwapAndMint } from '../components/SwapAndMint';
import { Header } from '../components/Header';
import { DebugPanel } from '../components/DebugPanel';

export default function Home() {
  return (
    <div>
      <Header />
      
      <main className="main-content">
        <SwapAndMint />
      </main>

      <DebugPanel />
    </div>
  );
}
