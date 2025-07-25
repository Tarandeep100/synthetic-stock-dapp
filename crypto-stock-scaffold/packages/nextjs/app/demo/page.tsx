"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { 
  useScaffoldReadContract,
  useScaffoldWriteContract
} from "~~/hooks/scaffold-eth";
import { Address, Balance } from "~~/components/scaffold-eth";
import { formatUnits, parseUnits } from "viem";

/**
 * Demo Dashboard - Phase 5: Demo Interface & Submission Package
 * Comprehensive demonstration of the Synthetic Stock dApp capabilities
 */

interface DemoStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  component: string;
}

interface SystemMetrics {
  totalCollateral: string;
  totalSupply: string;
  collateralizationRatio: number;
  oraclePrice: string;
  gasReserve: string;
  zkProofValid: boolean;
}

const Demo = () => {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [mintAmount, setMintAmount] = useState("100");

  // Contract read hooks
  const { data: oracleStats } = useScaffoldReadContract({
    contractName: "OracleAdapter",
    functionName: "getOracleStats",
  });

  const { data: totalCollateral } = useScaffoldReadContract({
    contractName: "CollateralVault",
    functionName: "getTotalCollateral",
  });

  const { data: aaplTotalSupply } = useScaffoldReadContract({
    contractName: "AAPLToken",
    functionName: "totalSupply",
  });

  const { data: systemRatio } = useScaffoldReadContract({
    contractName: "SyntheticStock",
    functionName: "getSystemCollateralizationRatio",
  });

  const { data: paymasterGas } = useScaffoldReadContract({
    contractName: "Paymaster",
    functionName: "getGasReserve",
  });

  const { data: zkProofStatus } = useScaffoldReadContract({
    contractName: "ZKSolvencyVerifier",
    functionName: "getSolvencyStatus",
  });

  const { data: userAaplBalance } = useScaffoldReadContract({
    contractName: "AAPLToken",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: userUsdcBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [address],
  });

  // Contract write hooks
  const { writeContractAsync: writeOracle } = useScaffoldWriteContract({
    contractName: "OracleAdapter",
  });

  const { writeContractAsync: writeMockUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC",
  });

  // Initialize demo steps
  useEffect(() => {
    const steps: DemoStep[] = [
      {
        id: "welcome",
        title: "Welcome to Synthetic Stock dApp",
        description: "Introduction to the comprehensive DeFi protocol for synthetic stock trading",
        status: "pending",
        component: "welcome"
      },
      {
        id: "system-overview",
        title: "System Architecture",
        description: "Overview of the complete system including contracts and integrations",
        status: "pending",
        component: "overview"
      },
      {
        id: "oracle-demo",
        title: "Oracle Price Updates",
        description: "Demonstrate real-time AAPL price feeds and oracle functionality",
        status: "pending",
        component: "oracle"
      },
      {
        id: "mint-demo",
        title: "Synthetic Stock Minting",
        description: "Mint AAPL-x tokens using USDC collateral",
        status: "pending",
        component: "mint"
      },
      {
        id: "redeem-demo",
        title: "Synthetic Stock Redemption",
        description: "Redeem AAPL-x tokens back to USDC collateral",
        status: "pending",
        component: "redeem"
      },
      {
        id: "dex-integration",
        title: "OKX DEX Integration",
        description: "Swap any token to USDC using OKX DEX API",
        status: "pending",
        component: "dex"
      },
      {
        id: "aa-demo",
        title: "Account Abstraction",
        description: "Gasless transactions and social recovery features",
        status: "pending",
        component: "aa"
      },
      {
        id: "zk-proof",
        title: "ZK Solvency Proofs",
        description: "Generate and verify zero-knowledge solvency proofs",
        status: "pending",
        component: "zk"
      },
      {
        id: "security-features",
        title: "Security Features",
        description: "Emergency pause, access control, and security measures",
        status: "pending",
        component: "security"
      },
      {
        id: "monitoring",
        title: "System Monitoring",
        description: "Real-time monitoring and health checks",
        status: "pending",
        component: "monitoring"
      }
    ];

    setDemoSteps(steps);
  }, []);

  // Update system metrics
  useEffect(() => {
    if (oracleStats && totalCollateral && aaplTotalSupply && systemRatio) {
      setSystemMetrics({
        totalCollateral: formatUnits(totalCollateral, 6),
        totalSupply: formatUnits(aaplTotalSupply, 18),
        collateralizationRatio: Number(systemRatio),
        oraclePrice: formatUnits(oracleStats[0], 8),
        gasReserve: paymasterGas ? formatUnits(paymasterGas, 18) : "0",
        zkProofValid: zkProofStatus ? zkProofStatus[0] : false
      });
    }
  }, [oracleStats, totalCollateral, aaplTotalSupply, systemRatio, paymasterGas, zkProofStatus]);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setDemoSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === currentStep ? 'completed' : index === currentStep + 1 ? 'active' : step.status
      })));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDemoSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === currentStep ? 'pending' : index === currentStep - 1 ? 'active' : step.status
      })));
      setCurrentStep(currentStep - 1);
    }
  };

  const runAutomaticDemo = async () => {
    setIsRunningDemo(true);
    
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      setDemoSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'active' : index < i ? 'completed' : 'pending'
      })));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    setIsRunningDemo(false);
  };

  const handleFaucet = async () => {
    try {
      await writeMockUSDC({
        functionName: "faucet",
        args: [],
      });
    } catch (error) {
      console.error("Faucet failed:", error);
    }
  };

  const handleMint = async () => {
    try {
      // First approve USDC
      await writeMockUSDC({
        functionName: "approve",
        args: [address, parseUnits(mintAmount, 6)],
      });
      
      // Then mint AAPL-x (this would go through AA in production)
      // await writeSyntheticStock({
      //   functionName: "mint",
      //   args: [parseUnits(mintAmount, 6)],
      // });
    } catch (error) {
      console.error("Mint failed:", error);
    }
  };

  const handleUpdatePrice = async () => {
    try {
      const newPrice = parseUnits("151.75", 8);
      await writeOracle({
        functionName: "pushPrice",
        args: [newPrice],
      });
    } catch (error) {
      console.error("Price update failed:", error);
    }
  };

  const renderStepContent = () => {
    const step = demoSteps[currentStep];
    if (!step) return null;

    switch (step.component) {
      case "welcome":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">🏗️ Synthetic Stock dApp</h2>
              <p className="text-lg text-gray-600 mb-6">
                A comprehensive DeFi protocol for trading synthetic stocks on OKX X Layer
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-3xl mb-2">🔮</div>
                <h3 className="font-semibold mb-2">Oracle Integration</h3>
                <p className="text-sm text-gray-600">Real-time AAPL price feeds with 5-minute updates</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-3xl mb-2">🔄</div>
                <h3 className="font-semibold mb-2">OKX DEX API</h3>
                <p className="text-sm text-gray-600">Native integration for token swaps and routing</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <div className="text-3xl mb-2">🔐</div>
                <h3 className="font-semibold mb-2">Account Abstraction</h3>
                <p className="text-sm text-gray-600">Gasless transactions and social recovery</p>
              </div>
            </div>
          </div>
        );

      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">📊 System Architecture</h2>
            {systemMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">Total Collateral</div>
                  <div className="text-xl font-bold">{systemMetrics.totalCollateral} USDC</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">AAPL-x Supply</div>
                  <div className="text-xl font-bold">{systemMetrics.totalSupply}</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">Collateral Ratio</div>
                  <div className="text-xl font-bold">{systemMetrics.collateralizationRatio}%</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">AAPL Price</div>
                  <div className="text-xl font-bold">${systemMetrics.oraclePrice}</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">Gas Reserve</div>
                  <div className="text-xl font-bold">{systemMetrics.gasReserve} ETH</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600">ZK Proof</div>
                  <div className="text-xl font-bold">{systemMetrics.zkProofValid ? '✅' : '❌'}</div>
                </div>
              </div>
            )}
          </div>
        );

      case "oracle":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">🔮 Oracle Price Updates</h2>
            <div className="bg-white p-6 rounded border">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-600">Current AAPL Price</div>
                  <div className="text-3xl font-bold">${systemMetrics?.oraclePrice}</div>
                </div>
                <button
                  onClick={handleUpdatePrice}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Price
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Oracle updates every 5 minutes during market hours with multiple price feed validation
              </p>
            </div>
          </div>
        );

      case "mint":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">💰 Mint AAPL-x Tokens</h2>
            <div className="bg-white p-6 rounded border">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    USDC Amount to Deposit
                  </label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded"
                    placeholder="100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Your USDC Balance: {userUsdcBalance ? formatUnits(userUsdcBalance, 6) : '0'}</div>
                  <div>Your AAPL-x Balance: {userAaplBalance ? formatUnits(userAaplBalance, 18) : '0'}</div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleFaucet}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Get Test USDC
                  </button>
                  <button
                    onClick={handleMint}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mint AAPL-x
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "zk":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">🔐 ZK Solvency Proofs</h2>
            <div className="bg-white p-6 rounded border">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">{systemMetrics?.zkProofValid ? '✅' : '❌'}</div>
                  <h3 className="text-xl font-semibold">
                    {systemMetrics?.zkProofValid ? 'System is Solvent' : 'Proof Required'}
                  </h3>
                  <p className="text-gray-600">
                    Zero-knowledge proof verifies system solvency without revealing sensitive data
                  </p>
                </div>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Generate ZK Proof
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p>{step.description}</p>
            <div className="bg-gray-100 p-6 rounded text-center">
              <div className="text-4xl mb-4">🚧</div>
              <p>This demo step is under construction</p>
            </div>
          </div>
        );
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Demo Dashboard</h1>
          <p className="text-lg text-gray-600">Please connect your wallet to access the demo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎭 Demo Dashboard</h1>
        <p className="text-lg text-gray-600">
          Interactive demonstration of the Synthetic Stock dApp capabilities
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Demo Progress</h3>
          <div className="flex gap-4">
            <button
              onClick={runAutomaticDemo}
              disabled={isRunningDemo}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isRunningDemo ? 'Running...' : '🚀 Auto Demo'}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {demoSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / demoSteps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
          {demoSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`p-2 text-xs rounded text-center ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : step.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : step.status === 'active'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === demoSteps.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Demo Content */}
      <div className="bg-white rounded-lg shadow-md p-8 min-h-96">
        {renderStepContent()}
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h3 className="text-xl font-semibold mb-4">👤 Your Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Wallet Address</div>
            <Address address={address} />
          </div>
          <div>
            <div className="text-sm text-gray-600">ETH Balance</div>
            <Balance address={address} />
          </div>
          <div>
            <div className="text-sm text-gray-600">USDC Balance</div>
            <div className="font-mono">
              {userUsdcBalance ? formatUnits(userUsdcBalance, 6) : '0'} USDC
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">AAPL-x Balance</div>
            <div className="font-mono">
              {userAaplBalance ? formatUnits(userAaplBalance, 18) : '0'} AAPL-x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo; 