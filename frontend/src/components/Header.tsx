'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function Header() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h1 className="logo-text">CryptoStock</h1>
          </div>

          {/* Navigation */}
          <nav className="nav">
            <a href="#trade" className="nav-link active">Trade</a>
            <a href="#explore" className="nav-link">Explore</a>
            <a href="#pool" className="nav-link">Pool</a>
          </nav>
        </div>

        {/* Search & Connect */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="search-container">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tokens and pools"
              className="search-input"
            />
          </div>

          {/* More Menu */}
          <button className="btn-ghost">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Connect Button */}
          {!isConnected ? (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="btn btn-primary"
            >
              Connect
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="btn-secondary" style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {formatAddress(address)}
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="btn-ghost"
                title="Disconnect"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 