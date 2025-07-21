'use client';

import React, { useState, useEffect } from 'react';
import { useSwapAndMint } from '../hooks/useSwapAndMint';
import { Token, okxDexService, X_LAYER_TESTNET_CHAIN_ID } from '../services/okxDexService';
import { useAccount, useConnect } from 'wagmi';

const AAPL_TOKEN = {
  chainId: X_LAYER_TESTNET_CHAIN_ID,
  address: '0xaaaa',
  name: 'Synthetic Apple Stock',
  symbol: 'AAPL-x',
  decimals: 18,
  logoURI: 'https://logo.stocks.tf/aapl.svg',
};

export function SwapAndMint() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Swap');
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  
  const {
    // State
    inputToken,
    outputToken,
    inputAmount,
    quote,
    isLoadingQuote,
    quoteError,
    isSwapping,
    isMinting,
    swapTxHash,
    mintTxHash,
    slippageTolerance,
    showAdvanced,
    
    // Computed values
    canGetQuote,
    canExecuteSwap,
    expectedAaplAmount,
    priceImpact,
    isHighImpact,
    
    // Actions
    setInputToken,
    setInputAmount,
    setSlippageTolerance,
    setShowAdvanced,
    getQuote,
    refreshQuote,
    executeSwapAndMint,
    reset,
  } = useSwapAndMint();

  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Load available tokens on mount
  useEffect(() => {
    const loadTokens = async () => {
      setLoadingTokens(true);
      try {
        const tokens = await okxDexService.getSupportedTokens(X_LAYER_TESTNET_CHAIN_ID);
        setAvailableTokens(tokens);
        console.log('📋 Loaded', tokens.length, 'tokens from OKX DEX');
      } catch (error) {
        console.error('Failed to load tokens:', error);
        // Fallback to empty array - mock data will be used
        setAvailableTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTokenSelect = (token: Token) => {
    setInputToken(token);
    setShowTokenSelector(false);
  };

  const handleExecuteSwap = async () => {
    try {
      await executeSwapAndMint();
    } catch (error) {
      console.error('Swap and mint failed:', error);
    }
  };

  const handleMaxClick = () => {
    // This would set the max balance of the selected token
    setInputAmount('1.0'); // Mock max amount for demo
  };

  // Auto-refresh quote when amount changes
  useEffect(() => {
    if (canGetQuote && inputAmount && parseFloat(inputAmount) > 0) {
      const timeoutId = setTimeout(() => {
        getQuote();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [inputAmount, inputToken, canGetQuote]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="swap-card">
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="swap-card">
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Connect Wallet</h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
            Connect your wallet to start trading synthetic stocks
          </p>
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="btn btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-card">
      {/* Tab Navigation */}
      <div className="swap-header">
        <div className="tab-nav">
          {['Swap', 'Limit', 'Buy', 'Sell'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-ghost"
          title="Settings"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Sell Input */}
      <div className="input-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="input-label">Sell</label>
          <button
            onClick={handleMaxClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            MAX
          </button>
        </div>
        <div className="token-input">
          <div className="token-input-content">
            <div style={{ flex: '1' }}>
              <input
                type="number"
                placeholder="0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="amount-input"
              />
              <div className="amount-usd">
                {inputToken && quote ? 
                  `≈ $${(parseFloat(inputAmount) * (inputToken.symbol === 'ETH' ? 2500 : 1)).toFixed(2)}` 
                  : '$0'
                }
              </div>
            </div>
            
            <div>
              <button
                onClick={() => setShowTokenSelector(true)}
                className="token-selector"
              >
                {inputToken ? (
                  <>
                    <img 
                      src={inputToken.logoURI} 
                      alt={inputToken.symbol}
                      className="token-icon"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="12" r="10"/></svg>`;
                      }}
                    />
                    <span className="token-symbol">{inputToken.symbol}</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <div className="token-icon"></div>
                    <span className="token-symbol">Select token</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="swap-arrow">
        <button className="swap-arrow-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Buy Input */}
      <div className="input-group">
        <label className="input-label">Buy</label>
        <div className="token-input">
          <div className="token-input-content">
            <div style={{ flex: '1' }}>
              <input
                type="number"
                placeholder="0"
                value={expectedAaplAmount || '0'}
                readOnly
                className="amount-input"
                style={{ opacity: '0.7' }}
              />
              <div className="amount-usd">
                ≈ ${expectedAaplAmount ? (parseFloat(expectedAaplAmount) * 150).toFixed(2) : '0'}
              </div>
            </div>
            
            <div>
              <div className="token-selector" style={{ cursor: 'default' }}>
                <img 
                  src={AAPL_TOKEN.logoURI} 
                  alt={AAPL_TOKEN.symbol}
                  className="token-icon"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="12" r="10"/></svg>`;
                  }}
                />
                <span className="token-symbol">{AAPL_TOKEN.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Information */}
      {quote && (
        <div className="quote-info">
          <div className="quote-row">
            <span className="quote-label">Rate</span>
            <span className="quote-value">
              1 {inputToken?.symbol} = {parseFloat(quote.outputTokenAmount) / Math.pow(10, 6)} USDC
            </span>
          </div>
          {priceImpact && (
            <div className="quote-row">
              <span className="quote-label">Price Impact</span>
              <span className="quote-value" style={{ color: isHighImpact ? 'var(--error)' : 'var(--success)' }}>
                {priceImpact}%
              </span>
            </div>
          )}
          <div className="quote-row">
            <span className="quote-label">Network Fee</span>
            <span className="quote-value">
              ≈ ${(parseFloat(quote.gasPrice) * parseFloat(quote.estimatedGas) / 1e18 * 2500).toFixed(2)}
            </span>
          </div>
          <div className="quote-row">
            <span className="quote-label">Route</span>
            <span className="quote-value">
              {quote.route.map(r => r.dexName).join(' + ')}
            </span>
          </div>
        </div>
      )}

      {/* Loading Quote */}
      {isLoadingQuote && (
        <div className="quote-info">
          <div className="loading">
            <div className="spinner"></div>
            Fetching best price...
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '24px' }}>
        {!inputToken ? (
          <button disabled className="btn btn-secondary w-full" style={{ opacity: '0.5', cursor: 'not-allowed' }}>
            Select Token
          </button>
        ) : !inputAmount || parseFloat(inputAmount) === 0 ? (
          <button disabled className="btn btn-secondary w-full" style={{ opacity: '0.5', cursor: 'not-allowed' }}>
            Enter Amount
          </button>
        ) : canGetQuote && !quote && !isLoadingQuote ? (
          <button
            onClick={getQuote}
            className="btn btn-secondary w-full"
          >
            Get Quote
          </button>
        ) : quote && canExecuteSwap ? (
          <button
            onClick={handleExecuteSwap}
            disabled={isSwapping || isMinting}
            className="btn btn-primary w-full"
          >
            {isSwapping ? (
              <div className="loading">
                <div className="spinner"></div>
                Swapping...
              </div>
            ) : isMinting ? (
              <div className="loading">
                <div className="spinner"></div>
                Minting AAPL-x...
              </div>
            ) : (
              `Swap for ${expectedAaplAmount || '0'} AAPL-x`
            )}
          </button>
        ) : quote ? (
          <button disabled className="btn btn-secondary w-full" style={{ opacity: '0.5', cursor: 'not-allowed' }}>
            {quoteError ? 'Quote Error' : 'Loading...'}
          </button>
        ) : (
          <button disabled className="btn btn-secondary w-full" style={{ opacity: '0.5', cursor: 'not-allowed' }}>
            Enter Amount
          </button>
        )}

        {quote && (
          <button
            onClick={refreshQuote}
            className="btn btn-ghost w-full"
            style={{ marginTop: '8px' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Quote
          </button>
        )}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Transaction Settings</h3>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              marginBottom: '8px', 
              fontWeight: '500', 
              color: 'var(--text-secondary)' 
            }}>
              Slippage Tolerance
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['0.1', '0.5', '1.0'].map((tolerance) => (
                <button
                  key={tolerance}
                  onClick={() => setSlippageTolerance((parseFloat(tolerance) / 100).toString())}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)',
                    background: slippageTolerance === (parseFloat(tolerance) / 100).toString() 
                      ? 'var(--accent-primary)' 
                      : 'var(--bg-secondary)',
                    color: slippageTolerance === (parseFloat(tolerance) / 100).toString() 
                      ? 'var(--white)' 
                      : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tolerance}%
                </button>
              ))}
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={parseFloat(slippageTolerance) * 100}
                onChange={(e) => setSlippageTolerance((parseFloat(e.target.value) / 100).toString())}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-primary)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  width: '80px',
                  textAlign: 'center'
                }}
                placeholder="Custom"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {swapTxHash && (
        <div className="quote-info" style={{ marginTop: '16px' }}>
          <div className="quote-row">
            <span className="quote-label">Swap Transaction</span>
            <a 
              href={`https://explorer.xlayer-testnet.tech/tx/${swapTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="quote-value"
              style={{ color: 'var(--accent-primary)' }}
            >
              View Explorer ↗
            </a>
          </div>
        </div>
      )}

      {mintTxHash && (
        <div className="quote-info" style={{ marginTop: '8px' }}>
          <div className="quote-row">
            <span className="quote-label">Mint Transaction</span>
            <a 
              href={`https://explorer.xlayer-testnet.tech/tx/${mintTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="quote-value"
              style={{ color: 'var(--accent-primary)' }}
            >
              View Explorer ↗
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {quoteError && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: 'rgba(255, 104, 113, 0.1)', 
          border: '1px solid var(--error)', 
          borderRadius: '12px',
          color: 'var(--error)',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Quote Error</div>
          {quoteError}
        </div>
      )}

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000'
        }}>
          <div className="swap-card" style={{ width: '400px', maxHeight: '600px', overflow: 'auto' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Select Token</h3>
              <button
                onClick={() => setShowTokenSelector(false)}
                className="btn-ghost"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '16px' }}>
              <div className="search-container">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tokens..."
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            {loadingTokens ? (
              <div className="loading" style={{ padding: '32px' }}>
                <div className="spinner"></div>
                Loading tokens...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--border-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                    }}
                  >
                    <img 
                      src={token.logoURI} 
                      alt={token.symbol}
                      className="token-icon"
                      style={{ width: '32px', height: '32px' }}
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="12" r="10"/></svg>`;
                      }}
                    />
                    <div style={{ flex: '1' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{token.symbol}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{token.name}</div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      0.00
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 