'use client';

import React, { useState, useEffect } from 'react';
import { okxDexService } from '../services/okxDexService';
import { useAccount } from 'wagmi';

interface CacheStats {
  size: number;
  entries: string[];
  mockMode: boolean;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, entries: [], mockMode: false });
  const { chain, isConnected } = useAccount();

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(okxDexService.getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: cacheStats.mockMode ? 'var(--warning)' : 'var(--accent-primary)',
          border: 'none',
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          zIndex: '1001',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease'
        }}
        title={`Debug Panel (${cacheStats.mockMode ? 'Mock Mode' : 'Live Mode'})`}
      >
        {cacheStats.mockMode ? '🎭' : '🔧'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '320px',
          maxHeight: '400px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          zIndex: '1000',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Debug Panel
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>

          {/* Connection Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Connection Status
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Wallet: {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Chain: {chain?.name || 'Unknown'} ({chain?.id || 'N/A'})
            </div>
          </div>

          {/* API Status */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              OKX DEX API Status
            </div>
            <div style={{ 
              color: cacheStats.mockMode ? 'var(--warning)' : 'var(--success)',
              marginBottom: '4px'
            }}>
              Mode: {cacheStats.mockMode ? '🎭 Mock Mode' : '🌐 Live Mode'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Cache Size: {cacheStats.size} entries
            </div>
          </div>

          {/* Cache Entries */}
          {cacheStats.entries.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Cached Quotes
              </div>
              <div style={{ 
                maxHeight: '80px', 
                overflow: 'auto',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                padding: '8px'
              }}>
                {cacheStats.entries.map((entry, index) => (
                  <div key={index} style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    marginBottom: '2px'
                  }}>
                    {entry.substring(0, 40)}...
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mock Mode Toggle */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => {
                okxDexService.setMockMode(!cacheStats.mockMode);
                setCacheStats(okxDexService.getCacheStats());
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)',
                backgroundColor: cacheStats.mockMode ? 'var(--warning)' : 'var(--success)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {cacheStats.mockMode ? 'Switch to Live Mode' : 'Switch to Mock Mode'}
            </button>
          </div>

          {/* Clear Cache */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => {
                okxDexService.clearCache();
                setCacheStats(okxDexService.getCacheStats());
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear Cache ({cacheStats.size})
            </button>
          </div>

          {/* Environment Info */}
          <div style={{ 
            padding: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Environment
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              NODE_ENV: {process.env.NODE_ENV}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              API_KEY: {process.env.NEXT_PUBLIC_OKX_DEX_API_KEY ? '✅ Set' : '❌ Missing'}
            </div>
          </div>

          {/* Phase Status */}
          <div style={{ 
            marginTop: '12px',
            padding: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Implementation Status
            </div>
            <div style={{ color: 'var(--success)' }}>✅ Phase 1: Foundation</div>
            <div style={{ color: 'var(--success)' }}>✅ Phase 2: Smart Contracts</div>
            <div style={{ color: 'var(--success)' }}>✅ Phase 3: OKX DEX Integration</div>
            <div style={{ color: 'var(--text-secondary)' }}>⏳ Phase 4: Account Abstraction</div>
            <div style={{ color: 'var(--text-secondary)' }}>⏳ Phase 5: Oracle & ZK Proofs</div>
          </div>
        </div>
      )}
    </>
  );
} 