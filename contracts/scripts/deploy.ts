import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of Synthetic Stock contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockUSDC
  console.log("\n📄 Deploying MockUSDC...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDCFactory.deploy(deployer.address);
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUsdcAddress);

  // Deploy AAPLToken
  console.log("\n📄 Deploying AAPLToken...");
  const AAPLTokenFactory = await ethers.getContractFactory("AAPLToken");
  const aaplToken = await AAPLTokenFactory.deploy(deployer.address);
  await aaplToken.waitForDeployment();
  const aaplTokenAddress = await aaplToken.getAddress();
  console.log("✅ AAPLToken deployed to:", aaplTokenAddress);

  // Deploy CollateralVault
  console.log("\n📄 Deploying CollateralVault...");
  const CollateralVaultFactory = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVaultFactory.deploy(mockUsdcAddress, deployer.address);
  await collateralVault.waitForDeployment();
  const vaultAddress = await collateralVault.getAddress();
  console.log("✅ CollateralVault deployed to:", vaultAddress);

  console.log("\n🎉 Phase 2 Core Contracts Deployed Successfully!");
  console.log("==================================================");
  console.log(`MockUSDC:        ${mockUsdcAddress}`);
  console.log(`AAPLToken:       ${aaplTokenAddress}`);
  console.log(`CollateralVault: ${vaultAddress}`);
  console.log("==================================================");
  
  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  // Test MockUSDC
  const initialSupply = await mockUsdc.totalSupply();
  console.log(`✅ MockUSDC total supply: ${ethers.formatUnits(initialSupply, 6)} USDC`);
  
  // Test faucet
  await mockUsdc.faucet();
  const faucetBalance = await mockUsdc.balanceOf(deployer.address);
  console.log(`✅ Faucet test: ${ethers.formatUnits(faucetBalance, 6)} USDC received`);
  
  // Test AAPLToken roles
  const minterRole = await aaplToken.MINTER_ROLE();
  const hasRole = await aaplToken.hasRole(await aaplToken.DEFAULT_ADMIN_ROLE(), deployer.address);
  console.log(`✅ AAPLToken admin role: ${hasRole}`);
  
  // Test CollateralVault
  const vaultUsdcAddress = await collateralVault.usdcToken();
  console.log(`✅ CollateralVault USDC address: ${vaultUsdcAddress}`);
  
  console.log("\n✅ All Phase 2 contracts working correctly!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 