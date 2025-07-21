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

  // Deploy OracleAdapter (implementation)
  console.log("\n📄 Deploying OracleAdapter...");
  const OracleAdapterFactory = await ethers.getContractFactory("OracleAdapter");
  const oracleImplementation = await OracleAdapterFactory.deploy();
  await oracleImplementation.waitForDeployment();
  const implementationAddress = await oracleImplementation.getAddress();
  console.log("📄 OracleAdapter implementation deployed to:", implementationAddress);
  
  // Deploy ERC1967Proxy for OracleAdapter
  console.log("📄 Deploying OracleAdapter proxy...");
  const initData = OracleAdapterFactory.interface.encodeFunctionData("initialize", [deployer.address]);
  
  const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ProxyFactory.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const oracleAddress = await proxy.getAddress();
  
  // Connect to the proxy with the OracleAdapter interface
  const oracleAdapter = OracleAdapterFactory.attach(oracleAddress) as any;
  console.log("✅ OracleAdapter proxy deployed to:", oracleAddress);

  // Deploy CollateralVault
  console.log("\n📄 Deploying CollateralVault...");
  const CollateralVaultFactory = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVaultFactory.deploy(mockUsdcAddress, deployer.address);
  await collateralVault.waitForDeployment();
  const vaultAddress = await collateralVault.getAddress();
  console.log("✅ CollateralVault deployed to:", vaultAddress);

  // Deploy SyntheticStock
  console.log("\n📄 Deploying SyntheticStock...");
  const SyntheticStockFactory = await ethers.getContractFactory("SyntheticStock");
  const syntheticStock = await SyntheticStockFactory.deploy();
  await syntheticStock.waitForDeployment();
  const syntheticStockAddress = await syntheticStock.getAddress();
  
  // Initialize SyntheticStock
  await syntheticStock.initialize(
    aaplTokenAddress,
    vaultAddress,
    oracleAddress,
    mockUsdcAddress,
    deployer.address
  );
  console.log("✅ SyntheticStock deployed to:", syntheticStockAddress);

  // Setup Permissions
  console.log("\n🔧 Setting up permissions...");
  
  // Grant SyntheticStock permission to mint/burn AAPL tokens
  await aaplToken.grantRole(await aaplToken.MINTER_ROLE(), syntheticStockAddress);
  await aaplToken.grantRole(await aaplToken.BURNER_ROLE(), syntheticStockAddress);
  console.log("✅ Granted AAPL token mint/burn roles to SyntheticStock");
  
  // Grant SyntheticStock permission to manage collateral
  await collateralVault.grantRole(await collateralVault.SYNTHETIC_STOCK_ROLE(), syntheticStockAddress);
  console.log("✅ Granted CollateralVault role to SyntheticStock");
  
  // Grant deployer oracle operator role
  await oracleAdapter.grantRole(await oracleAdapter.OPERATOR_ROLE(), deployer.address);
  console.log("✅ Granted Oracle operator role to deployer");

  // Set Initial AAPL Price
  console.log("\n💰 Setting initial AAPL price...");
  const initialPrice = ethers.parseUnits("150.25", 8); // $150.25 with 8 decimals
  await oracleAdapter.pushPrice(initialPrice);
  console.log("✅ Set initial AAPL price to $150.25");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  // Test MockUSDC
  const initialSupply = await mockUsdc.totalSupply();
  console.log(`✅ MockUSDC total supply: ${ethers.formatUnits(initialSupply, 6)} USDC`);
  
  // Test Oracle
  const [currentPrice, ] = await oracleAdapter.getPrice();
  console.log(`✅ Current AAPL price: $${ethers.formatUnits(currentPrice, 8)}`);
  
  // Test AAPLToken roles
  const hasMinterRole = await aaplToken.hasRole(await aaplToken.MINTER_ROLE(), syntheticStockAddress);
  console.log(`✅ SyntheticStock has minter role: ${hasMinterRole}`);

  console.log("\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`MockUSDC:        ${mockUsdcAddress}`);
  console.log(`AAPLToken:       ${aaplTokenAddress}`);
  console.log(`OracleAdapter:   ${oracleAddress}`);
  console.log(`CollateralVault: ${vaultAddress}`);
  console.log(`SyntheticStock:  ${syntheticStockAddress}`);
  console.log("==================================================");
  
  console.log("\n📋 Frontend Environment Variables:");
  console.log("Add these to your frontend/.env.local file:");
  console.log(`NEXT_PUBLIC_MOCK_USDC_ADDRESS=${mockUsdcAddress}`);
  console.log(`NEXT_PUBLIC_AAPL_TOKEN_ADDRESS=${aaplTokenAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADAPTER_ADDRESS=${oracleAddress}`);
  console.log(`NEXT_PUBLIC_COLLATERAL_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`NEXT_PUBLIC_SYNTHETIC_STOCK_ADDRESS=${syntheticStockAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 