import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as cron from "node-cron";

/**
 * ZK Solvency Prover - Phase 5 POC
 * Generates zero-knowledge proofs of system solvency per SDD requirements
 * Proves totalCollateral >= 1.5 * totalSupply without revealing exact amounts
 */

interface SolvencyData {
  totalCollateral: bigint;
  totalSupply: bigint;
  collateralizationRatio: number;
  timestamp: number;
  blockNumber: number;
}

interface ZKProof {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
}

export class ZKSolvencyProver {
  private syntheticStockContract: any;
  private collateralVaultContract: any;
  private zkVerifierContract: any;
  private circuitWasmPath: string;
  private circuitZkeyPath: string;

  constructor() {
    // ZK circuit paths (would be generated from Circom)
    this.circuitWasmPath = path.join(__dirname, "../circuits/solvency.wasm");
    this.circuitZkeyPath = path.join(__dirname, "../circuits/solvency_final.zkey");
  }

  async initialize() {
    console.log("🔧 Initializing ZK Solvency Prover...");
    
    try {
      // Get contract instances
      const syntheticStockAddress = process.env.SYNTHETIC_STOCK_ADDRESS;
      const collateralVaultAddress = process.env.COLLATERAL_VAULT_ADDRESS;
      const zkVerifierAddress = process.env.ZK_VERIFIER_ADDRESS;

      if (!syntheticStockAddress || !collateralVaultAddress || !zkVerifierAddress) {
        throw new Error("Contract addresses not set in environment");
      }

      const SyntheticStock = await ethers.getContractFactory("SyntheticStock");
      const CollateralVault = await ethers.getContractFactory("CollateralVault");
      const ZKSolvencyVerifier = await ethers.getContractFactory("ZKSolvencyVerifier");

      this.syntheticStockContract = SyntheticStock.attach(syntheticStockAddress);
      this.collateralVaultContract = CollateralVault.attach(collateralVaultAddress);
      this.zkVerifierContract = ZKSolvencyVerifier.attach(zkVerifierAddress);

      console.log("✅ Connected to contracts:");
      console.log(`📊 SyntheticStock: ${syntheticStockAddress}`);
      console.log(`🏦 CollateralVault: ${collateralVaultAddress}`);
      console.log(`🔐 ZKVerifier: ${zkVerifierAddress}`);

      // Initialize circuit files if they don't exist
      await this.initializeCircuits();

    } catch (error) {
      console.error("❌ Failed to initialize ZK Prover:", error);
      throw error;
    }
  }

  async initializeCircuits() {
    console.log("🔧 Setting up ZK circuits...");
    
    // Create circuits directory if it doesn't exist
    const circuitsDir = path.join(__dirname, "../circuits");
    if (!fs.existsSync(circuitsDir)) {
      fs.mkdirSync(circuitsDir, { recursive: true });
    }

    // Generate Circom circuit if it doesn't exist
    await this.generateSolvencyCircuit();
    
    // For POC, we'll simulate the circuit compilation
    // In production, this would involve actual Circom compilation
    await this.compileMockCircuit();
  }

  private async generateSolvencyCircuit() {
    const circuitCode = `
pragma circom 2.0.0;

/*
 * Solvency Circuit - Proves totalCollateral >= 1.5 * totalSupply
 * Without revealing exact amounts
 */

template SolvencyProof() {
    // Private inputs (hidden from verifier)
    signal private input totalCollateral;      // Total USDC collateral
    signal private input totalSupply;          // Total AAPL-x supply
    signal private input collateralPrice;      // USDC price (should be 1)
    signal private input aaplPrice;            // AAPL price from oracle
    signal private input nonce;               // Random nonce for uniqueness
    
    // Public inputs (visible to verifier)  
    signal input publicHash;                   // Hash of private inputs for verification
    signal input minRatio;                     // Minimum required ratio (150)
    signal input timestamp;                    // Proof timestamp
    
    // Outputs
    signal output isSolvent;                   // 1 if solvent, 0 if not
    signal output ratioProof;                  // Proof that ratio >= minRatio
    
    // Components
    component hasher = Poseidon(5);
    component geq = GreaterEqualThan(64);
    component mult1 = Mult();
    component mult2 = Mult();
    component mult3 = Mult();
    
    // Verify public hash matches private inputs
    hasher.inputs[0] <== totalCollateral;
    hasher.inputs[1] <== totalSupply;
    hasher.inputs[2] <== aaplPrice;
    hasher.inputs[3] <== timestamp;
    hasher.inputs[4] <== nonce;
    publicHash === hasher.out;
    
    // Calculate collateral value in USD
    mult1.a <== totalCollateral;
    mult1.b <== collateralPrice;  // Should be 1 for USDC
    
    // Calculate required collateral (totalSupply * aaplPrice * 1.5)
    mult2.a <== totalSupply;
    mult2.b <== aaplPrice;
    
    mult3.a <== mult2.out;
    mult3.b <== minRatio;  // 150 (representing 1.5 * 100)
    
    // Check if collateral * 100 >= required collateral
    geq.in[0] <== mult1.out * 100;
    geq.in[1] <== mult3.out;
    
    isSolvent <== geq.out;
    ratioProof <== geq.out;
    
    // Ensure the system is actually solvent
    isSolvent === 1;
}

component main = SolvencyProof();
`;

    const circuitPath = path.join(__dirname, "../circuits/solvency.circom");
    fs.writeFileSync(circuitPath, circuitCode);
    console.log("✅ Generated solvency circuit");
  }

  private async compileMockCircuit() {
    // For POC, create mock circuit files
    // In production, this would compile actual Circom circuits
    
    console.log("🔧 Compiling circuits (mock)...");
    
    // Mock WASM file
    const mockWasm = Buffer.from("mock_wasm_content");
    fs.writeFileSync(this.circuitWasmPath, mockWasm);
    
    // Mock zkey file  
    const mockZkey = Buffer.from("mock_zkey_content");
    fs.writeFileSync(this.circuitZkeyPath, mockZkey);
    
    console.log("✅ Mock circuits compiled");
  }

  async collectSolvencyData(): Promise<SolvencyData> {
    console.log("📊 Collecting solvency data...");
    
    try {
      // Get current block
      const blockNumber = await ethers.provider.getBlockNumber();
      
      // Get total collateral from vault
      const totalCollateral = await this.collateralVaultContract.getTotalCollateral();
      
      // Get total AAPL-x supply
      const aaplTokenAddress = await this.syntheticStockContract.aaplToken();
      const AAPLToken = await ethers.getContractFactory("AAPLToken");
      const aaplContract = AAPLToken.attach(aaplTokenAddress);
      const totalSupply = await aaplContract.totalSupply();
      
      // Calculate collateralization ratio
      const ratio = await this.syntheticStockContract.getSystemCollateralizationRatio();
      
      const data: SolvencyData = {
        totalCollateral,
        totalSupply,
        collateralizationRatio: Number(ratio),
        timestamp: Math.floor(Date.now() / 1000),
        blockNumber
      };
      
      console.log("📊 Solvency Data Collected:");
      console.log(`🏦 Total Collateral: ${ethers.formatUnits(totalCollateral, 6)} USDC`);
      console.log(`📈 Total Supply: ${ethers.formatUnits(totalSupply, 18)} AAPL-x`);
      console.log(`📊 Ratio: ${data.collateralizationRatio}%`);
      console.log(`⏰ Timestamp: ${new Date(data.timestamp * 1000).toISOString()}`);
      console.log(`🔢 Block: ${blockNumber}`);
      
      return data;
      
    } catch (error) {
      console.error("❌ Failed to collect solvency data:", error);
      throw error;
    }
  }

  async generateProof(data: SolvencyData): Promise<ZKProof> {
    console.log("🔐 Generating ZK proof...");
    
    try {
      // For POC, we'll generate a mock proof
      // In production, this would use snarkjs or similar library
      
      const mockProof = await this.generateMockProof(data);
      
      console.log("✅ ZK proof generated successfully");
      console.log(`🔐 Proof size: ${JSON.stringify(mockProof).length} bytes`);
      
      return mockProof;
      
    } catch (error) {
      console.error("❌ Failed to generate ZK proof:", error);
      throw error;
    }
  }

  private async generateMockProof(data: SolvencyData): Promise<ZKProof> {
    // Mock ZK proof structure (Groth16 format)
    // In production, this would be generated by snarkjs
    
    const nonce = Math.floor(Math.random() * 1000000);
    
    // Calculate public hash (would be real Poseidon hash in production)
    const publicHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256"],
        [data.totalCollateral, data.totalSupply, data.timestamp, nonce]
      )
    );
    
    return {
      proof: {
        a: [
          "0x" + "1".repeat(64),
          "0x" + "2".repeat(64)
        ],
        b: [
          ["0x" + "3".repeat(64), "0x" + "4".repeat(64)],
          ["0x" + "5".repeat(64), "0x" + "6".repeat(64)]
        ],
        c: [
          "0x" + "7".repeat(64),
          "0x" + "8".repeat(64)
        ]
      },
      publicSignals: [
        publicHash,
        "150", // minRatio
        data.timestamp.toString(),
        "1", // isSolvent
        "1"  // ratioProof
      ]
    };
  }

  async verifyProof(proof: ZKProof): Promise<boolean> {
    console.log("🔍 Verifying ZK proof on-chain...");
    
    try {
      // Convert proof to contract format
      const formattedProof = [
        proof.proof.a,
        proof.proof.b,
        proof.proof.c
      ];
      
      // Submit proof to ZK verifier contract
      const [signer] = await ethers.getSigners();
      const tx = await this.zkVerifierContract.connect(signer).submitSolvencyProof(
        formattedProof,
        proof.publicSignals
      );
      
      console.log(`📡 Proof submission tx: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Proof verified! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Check verification result
      const isValid = await this.zkVerifierContract.isLatestProofValid();
      console.log(`🔐 Proof valid: ${isValid}`);
      
      return isValid;
      
    } catch (error) {
      console.error("❌ Proof verification failed:", error);
      return false;
    }
  }

  async generateAndSubmitProof(): Promise<boolean> {
    console.log("\n🚀 Starting full ZK solvency proof generation...");
    
    try {
      // Step 1: Collect current system data
      const data = await this.collectSolvencyData();
      
      // Step 2: Check if system is actually solvent
      if (data.collateralizationRatio < 150) {
        throw new Error(`System is under-collateralized: ${data.collateralizationRatio}%`);
      }
      
      // Step 3: Generate ZK proof
      const proof = await this.generateProof(data);
      
      // Step 4: Verify proof on-chain
      const isValid = await this.verifyProof(proof);
      
      if (isValid) {
        console.log("✅ Solvency proof generation completed successfully!");
        
        // Log proof details
        console.log("\n📋 Proof Summary:");
        console.log(`🏦 System Collateralization: ${data.collateralizationRatio}%`);
        console.log(`✅ Required Minimum: 150%`);
        console.log(`🔐 ZK Proof: Valid`);
        console.log(`⏰ Proof Timestamp: ${new Date(data.timestamp * 1000).toISOString()}`);
        
        return true;
      } else {
        throw new Error("Proof verification failed");
      }
      
    } catch (error) {
      console.error("❌ ZK proof generation failed:", error);
      return false;
    }
  }

  async getProofStatus() {
    try {
      const [isValid, timestamp, ratio] = await this.zkVerifierContract.getSolvencyStatus();
      
      return {
        isValid,
        timestamp: Number(timestamp),
        ratio: Number(ratio),
        age: Math.floor(Date.now() / 1000) - Number(timestamp)
      };
    } catch (error) {
      console.error("Failed to get proof status:", error);
      return null;
    }
  }

  // Automated proof generation (weekly per SDD)
  startWeeklyProofGeneration() {
    console.log("📅 Starting weekly ZK proof generation...");
    
    // Generate proof every Sunday at 00:00 UTC
    cron.schedule("0 0 * * 0", async () => {
      console.log("📅 Weekly ZK proof generation triggered...");
      await this.generateAndSubmitProof();
    });
    
    console.log("✅ Weekly proof generation scheduled");
  }
}

// CLI interface
async function main() {
  const prover = new ZKSolvencyProver();
  
  try {
    await prover.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case "generate":
        const success = await prover.generateAndSubmitProof();
        process.exit(success ? 0 : 1);
        break;
        
      case "status":
        const status = await prover.getProofStatus();
        console.log("🔐 ZK Proof Status:", JSON.stringify(status, null, 2));
        break;
        
      case "schedule":
        prover.startWeeklyProofGeneration();
        console.log("📅 Weekly proof generation started. Press Ctrl+C to stop.");
        process.on('SIGINT', () => {
          console.log("\n🛑 Stopping proof scheduler...");
          process.exit(0);
        });
        break;
        
      default:
        console.log("Usage:");
        console.log("  yarn zk-proof generate  - Generate and submit a solvency proof");
        console.log("  yarn zk-proof status    - Check latest proof status");
        console.log("  yarn zk-proof schedule  - Start weekly proof generation");
    }
    
  } catch (error) {
    console.error("❌ ZK Prover failed:", error);
    process.exit(1);
  }
}

// Export for use in other modules
export default ZKSolvencyProver;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
} 