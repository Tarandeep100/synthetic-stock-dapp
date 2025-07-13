# Synthetic Stock dApp

> Trade synthetic stocks using crypto on OKX X Layer

A crypto-native application that allows users to mint and redeem synthetic Apple (AAPL-x) shares using USDC as collateral, with seamless token swaps via OKX DEX API and gasless transactions through Account Abstraction.

## 🏆 Hackathon Tracks

This project covers all four OKX DEX hackathon tracks:

- **Smart Account UX & Abstraction**: Gasless transactions, social recovery, session keys
- **Next-Gen Infrastructure**: Deployed on X Layer (ZK rollup), oracle efficiency
- **Security & Privacy Tooling**: ZK solvency proofs, secure architecture
- **DeFi, RWAs & Autonomous Apps**: Synthetic stock tokens, collateral management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- MetaMask or compatible wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/synthetic-stock-dapp
cd synthetic-stock-dapp

# Install dependencies
npm install

# Start development environment
npm run dev
```

### Local Development

```bash
# Terminal 1: Start local blockchain
npm run deploy:local

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Start oracle service
npm run oracle:start
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   Oracle        │
│   (Next.js)     │◄──►│   Contracts     │◄──►│   Service       │
│                 │    │   (Solidity)    │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   OKX DEX API   │    │   X Layer       │
│   (Swaps)       │    │   (Deployment)  │
└─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
synthetic-stock-dapp/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/      # Solidity source files
│   ├── test/          # Contract tests
│   └── scripts/       # Deployment scripts
├── frontend/          # React/Next.js dApp
│   ├── components/    # UI components
│   ├── pages/         # Next.js pages
│   └── services/      # API clients
├── oracle/            # Price oracle service
│   ├── src/           # Oracle source code
│   └── config/        # Configuration files
├── docs/              # Documentation
└── tests/             # Integration tests
```

## 🔧 Core Features

### For Users
- **Mint AAPL-x**: Deposit USDC to receive synthetic Apple shares
- **Redeem**: Burn AAPL-x to get USDC back
- **Swap & Mint**: Use any token → USDC → AAPL-x in one transaction
- **Gasless UX**: No gas fees for first-time users
- **Social Recovery**: Recover wallet with trusted guardians

### For Developers
- **Account Abstraction**: EIP-4337 smart accounts
- **OKX DEX Integration**: Best swap routes and liquidity
- **ZK Proofs**: Privacy-preserving solvency verification
- **Oracle System**: Real-time AAPL price feeds

## 🛠️ Development

### Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run test
npm run deploy:local
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

### Oracle Service

```bash
cd oracle
npm install
npm run start
npm run test
```

## 🚀 Deployment

### X Layer Testnet

```bash
# Deploy contracts
npm run deploy:xlayer

# Start oracle
npm run oracle:start

# Deploy frontend
npm run build
```

### Environment Variables

Create `.env` files in each workspace:

```bash
# contracts/.env
PRIVATE_KEY=your_private_key
XLAYER_RPC_URL=https://rpc.xlayer.okx.com
ETHERSCAN_API_KEY=your_etherscan_key

# frontend/.env.local
NEXT_PUBLIC_CHAIN_ID=196
NEXT_PUBLIC_RPC_URL=https://rpc.xlayer.okx.com
OKX_DEX_API_KEY=your_okx_api_key

# oracle/.env
ORACLE_PRIVATE_KEY=your_oracle_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Contract tests
npm run test --workspace=contracts

# Frontend tests
npm run test --workspace=frontend

# Integration tests
npm run test:integration
```

## 📚 Documentation

- [Software Design Document](./docs/SDD.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔐 Security

- All smart contracts use OpenZeppelin libraries
- UUPS upgradeable pattern for future improvements
- Comprehensive test coverage (>90%)
- ZK proofs for privacy-preserving solvency
- Multi-signature oracle operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

**Team**: Synthetic Stock Warriors  
**Tracks**: All four tracks covered  
**Demo**: [Live Demo URL]  
**Video**: [Demo Video URL]  

## 🔗 Links

- [OKX DEX API Documentation](https://web3.okx.com/build/dev-docs/dex-api/dex-what-is-dex-api)
- [X Layer Network](https://web3.okx.com/xlayer)
- [Live dApp]
- [Demo Video]