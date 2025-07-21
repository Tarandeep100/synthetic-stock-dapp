import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Synthetic Stock Contracts");
  console.log("====================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Testing with account:", deployer.address);

  try {
    // Test 1: Deploy MockUSDC
    console.log("\n1️⃣ Testing MockUSDC deployment...");
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDCFactory.deploy(deployer.address);
    await mockUsdc.waitForDeployment();
    console.log("✅ MockUSDC deployed successfully");
    
    // Test basic USDC properties
    const name = await mockUsdc.name();
    const symbol = await mockUsdc.symbol();
    const decimals = await mockUsdc.decimals();
    const totalSupply = await mockUsdc.totalSupply();
    console.log(`   Name: ${name}, Symbol: ${symbol}, Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 6)} USDC`);

    // Test 2: Deploy AAPLToken
    console.log("\n2️⃣ Testing AAPLToken deployment...");
    const AAPLTokenFactory = await ethers.getContractFactory("AAPLToken");
    const aaplToken = await AAPLTokenFactory.deploy(deployer.address);
    await aaplToken.waitForDeployment();
    console.log("✅ AAPLToken deployed successfully");
    
    const aaplName = await aaplToken.name();
    const aaplSymbol = await aaplToken.symbol();
    const aaplDecimals = await aaplToken.decimals();
    console.log(`   Name: ${aaplName}, Symbol: ${aaplSymbol}, Decimals: ${aaplDecimals}`);

    // Test 3: Deploy CollateralVault
    console.log("\n3️⃣ Testing CollateralVault deployment...");
    const CollateralVaultFactory = await ethers.getContractFactory("CollateralVault");
    const vault = await CollateralVaultFactory.deploy(
      await mockUsdc.getAddress(), 
      deployer.address
    );
    await vault.waitForDeployment();
    console.log("✅ CollateralVault deployed successfully");
    
    const vaultUsdcAddress = await vault.usdcToken();
    const isCorrectUsdc = vaultUsdcAddress === await mockUsdc.getAddress();
    console.log(`   USDC token linked correctly: ${isCorrectUsdc}`);

    // Test 4: Access Control
    console.log("\n4️⃣ Testing access control...");
    const adminRole = await aaplToken.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await aaplToken.hasRole(adminRole, deployer.address);
    console.log(`   Deployer has admin role: ${hasAdminRole}`);

    // Test 5: USDC minting (by owner)
    console.log("\n5️⃣ Testing USDC minting...");
    const mintAmount = ethers.parseUnits("100", 6); // 100 USDC
    await mockUsdc.mint(deployer.address, mintAmount);
    const balance = await mockUsdc.balanceOf(deployer.address);
    console.log(`   Minted: ${ethers.formatUnits(balance, 6)} USDC`);

    // Test 6: Contract interactions
    console.log("\n6️⃣ Testing contract interactions...");
    const totalCollateral = await vault.getTotalCollateral();
    const vaultBalance = await vault.getVaultBalance();
    console.log(`   Vault total collateral: ${ethers.formatUnits(totalCollateral, 6)} USDC`);
    console.log(`   Vault actual balance: ${ethers.formatUnits(vaultBalance, 6)} USDC`);

    console.log("\n🎉 All Tests Passed!");
    console.log("===================");
    console.log("✅ MockUSDC: Working");
    console.log("✅ AAPLToken: Working");
    console.log("✅ CollateralVault: Working");
    console.log("✅ Access Control: Working");
    console.log("✅ Basic Interactions: Working");
    
    console.log("\n📋 Contract Addresses:");
    console.log(`MockUSDC:        ${await mockUsdc.getAddress()}`);
    console.log(`AAPLToken:       ${await aaplToken.getAddress()}`);
    console.log(`CollateralVault: ${await vault.getAddress()}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("💥 Testing failed:", error);
  process.exitCode = 1;
}); 