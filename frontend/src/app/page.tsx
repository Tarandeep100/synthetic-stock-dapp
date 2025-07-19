import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Synthetic Stock dApp
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Trade synthetic stocks using crypto on OKX X Layer. 
            Swap any token → USDC → AAPL-x with gasless transactions.
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 text-2xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold mb-2">Swap & Mint</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Use any token to mint synthetic AAPL shares via OKX DEX API
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-green-600 dark:text-green-400 text-2xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Gasless UX</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Account abstraction with social recovery and sponsored transactions
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-purple-600 dark:text-purple-400 text-2xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">ZK Privacy</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Zero-knowledge proofs for solvency without revealing balances
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-orange-600 dark:text-orange-400 text-2xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold mb-2">X Layer</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Built on OKX's ZK rollup for fast, cheap transactions
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Connect your wallet to start trading synthetic AAPL shares
            </p>
            <button 
              disabled 
              className="bg-gray-300 text-gray-500 px-8 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Connect Wallet (Development)
            </button>
          </div>
        </div>

        {/* Hackathon Badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium">
            🏆 Built for OKX DEX Hackathon
          </div>
        </div>
      </div>
    </div>
  );
}
