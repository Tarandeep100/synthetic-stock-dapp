import { ethers } from "hardhat";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🔍 Testing X Layer Testnet Connection...");
  
  // Check environment variables first
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.XLAYER_TESTNET_RPC_URL;
  
  console.log("🔧 Environment Check:");
  console.log("   Private Key:", privateKey ? `Set (${privateKey.length} chars)` : "❌ NOT SET");
  console.log("   RPC URL:", rpcUrl || "❌ NOT SET");
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    return;
  }
  
  if (privateKey.startsWith('0x')) {
    console.error("❌ Remove '0x' prefix from PRIVATE_KEY in .env file");
    return;
  }
  
  if (privateKey.length !== 64) {
    console.error(`❌ PRIVATE_KEY should be 64 characters, got ${privateKey.length}`);
    return;
  }
  
  try {
    // Get all signers
    const signers = await ethers.getSigners();
    
    console.log("✅ Wallet connected!");
    console.log("📊 Number of signers:", signers.length);
    
    if (signers.length === 0) {
      throw new Error("No signers found - check your PRIVATE_KEY in .env");
    }
    
    const deployer = signers[0];
    console.log("📍 Address:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInOKB = ethers.formatEther(balance);
    
    console.log("💰 Balance:", balanceInOKB, "OKB");
    
    // Check if we have enough for deployment (at least 0.01 OKB)
    const minBalance = ethers.parseEther("0.01");
    
    if (balance >= minBalance) {
      console.log("✅ Sufficient balance for deployment!");
    } else {
      console.log("⚠️  Low balance - get testnet OKB from faucet");
      console.log("   Need at least 0.01 OKB for deployment");
    }
    
    // Test network info
    const network = await deployer.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    
    // Check if the address matches expected format
    if (deployer.address.startsWith('0x') && deployer.address.length === 42) {
      console.log("✅ Valid Ethereum address format");
    } else {
      console.log("❌ Invalid address format");
    }
    
    if (network.chainId === 195n) {
      console.log("✅ Connected to X Layer Testnet (195)");
    } else {
      console.log("❌ Wrong network! Expected Chain ID 195");
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Connection failed:", errorMessage);
    
    if (errorMessage.includes("private key")) {
      console.log("💡 Check your PRIVATE_KEY in .env file");
    }
    if (errorMessage.includes("network")) {
      console.log("💡 Check your XLAYER_TESTNET_RPC_URL in .env file");
    }
  }
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Script failed:", errorMessage);
  process.exitCode = 1;
}); 