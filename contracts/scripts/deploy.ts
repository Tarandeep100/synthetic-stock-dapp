import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of Synthetic Stock dApp (Complete SDD Architecture)...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy MockUSDC (testnet USDC with 6 decimals per SDD)
  console.log("\n📄 Deploying MockUSDC...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDCFactory.deploy(deployer.address);
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUsdcAddress);

  // For demo purposes, create a mock OKB token
  console.log("\n📄 Deploying Mock OKB Token...");
  const MockOKBFactory = await ethers.getContractFactory("MockUSDC"); // Reuse MockUSDC structure
  const mockOkb = await MockOKBFactory.deploy(deployer.address);
  await mockOkb.waitForDeployment();
  const mockOkbAddress = await mockOkb.getAddress();
  console.log("✅ Mock OKB deployed to:", mockOkbAddress);

  // Deploy AAPLToken (synthetic AAPL with 18 decimals per SDD)
  console.log("\n📄 Deploying AAPLToken...");
  const AAPLTokenFactory = await ethers.getContractFactory("AAPLToken");
  const aaplToken = await AAPLTokenFactory.deploy(deployer.address);
  await aaplToken.waitForDeployment();
  const aaplTokenAddress = await aaplToken.getAddress();
  console.log("✅ AAPLToken deployed to:", aaplTokenAddress);

  // Deploy OracleAdapter (implementation) - per SDD section 6.2
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

  // Deploy CollateralVault - per SDD architecture
  console.log("\n📄 Deploying CollateralVault...");
  const CollateralVaultFactory = await ethers.getContractFactory("CollateralVault");
  const collateralVault = await CollateralVaultFactory.deploy(mockUsdcAddress, deployer.address);
  await collateralVault.waitForDeployment();
  const vaultAddress = await collateralVault.getAddress();
  console.log("✅ CollateralVault deployed to:", vaultAddress);

  // Deploy SyntheticStock (main contract) - per SDD section 6.1
  console.log("\n📄 Deploying SyntheticStock...");
  const SyntheticStockFactory = await ethers.getContractFactory("SyntheticStock");
  const syntheticStock = await SyntheticStockFactory.deploy();
  await syntheticStock.waitForDeployment();
  const syntheticStockAddress = await syntheticStock.getAddress();
  
  // Initialize SyntheticStock with all dependencies
  await syntheticStock.initialize(
    aaplTokenAddress,
    vaultAddress,
    oracleAddress,
    mockUsdcAddress,
    deployer.address
  );
  console.log("✅ SyntheticStock deployed to:", syntheticStockAddress);

  // Deploy Paymaster for gasless UX (per SDD FR-4)
  console.log("\n📄 Deploying Paymaster...");
  const PaymasterFactory = await ethers.getContractFactory("Paymaster");
  const paymaster = await PaymasterFactory.deploy(
    mockUsdcAddress,
    mockOkbAddress,
    deployer.address
  );
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("✅ Paymaster deployed to:", paymasterAddress);

  // Deploy DEXRouter for OKX integration (per SDD FR-6) - Updated for vault flow
  console.log("\n📄 Deploying DEXRouter...");
  // For testnet, use a mock aggregator address (replace with real OKX aggregator on mainnet)
  const mockOKXAggregator = "0x1000000000000000000000000000000000000001"; // Placeholder
  const DEXRouterFactory = await ethers.getContractFactory("DEXRouter");
  const dexRouter = await DEXRouterFactory.deploy(
    vaultAddress, // Updated to use vault instead of synthetic stock
    mockUsdcAddress,
    mockOKXAggregator,
    deployer.address
  );
  await dexRouter.waitForDeployment();
  const dexRouterAddress = await dexRouter.getAddress();
  console.log("✅ DEXRouter deployed to:", dexRouterAddress);

  // Deploy ZK Solvency Verifier (per SDD security requirements)
  console.log("\n📄 Deploying ZKSolvencyVerifier...");
  const ZKSolvencyVerifierFactory = await ethers.getContractFactory("ZKSolvencyVerifier");
  const zkVerifier = await ZKSolvencyVerifierFactory.deploy(
    syntheticStockAddress,
    deployer.address
  );
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log("✅ ZKSolvencyVerifier deployed to:", zkVerifierAddress);

  // Deploy SmartAccount (Account Abstraction) - per SDD Architecture
  console.log("\n📄 Deploying SmartAccount (Account Abstraction)...");
  // Create mock guardians for demo (in production, these would be real addresses)
  const guardians = [
    "0x2000000000000000000000000000000000000001",
    "0x2000000000000000000000000000000000000002", 
    "0x2000000000000000000000000000000000000003"
  ];
  
  const SmartAccountFactory = await ethers.getContractFactory("SmartAccount");
  const smartAccount = await SmartAccountFactory.deploy(
    deployer.address, // owner
    guardians,
    dexRouterAddress,
    syntheticStockAddress,
    paymasterAddress
  );
  await smartAccount.waitForDeployment();
  const smartAccountAddress = await smartAccount.getAddress();
  console.log("✅ SmartAccount deployed to:", smartAccountAddress);

  // Setup Permissions and Architecture Flow per SDD
  console.log("\n🔧 Setting up permissions and architecture flow...");
  
  // Grant SyntheticStock permission to mint/burn AAPL tokens
  await aaplToken.grantRole(await aaplToken.MINTER_ROLE(), syntheticStockAddress);
  await aaplToken.grantRole(await aaplToken.BURNER_ROLE(), syntheticStockAddress);
  console.log("✅ Granted AAPL token mint/burn roles to SyntheticStock");
  
  // Grant SyntheticStock permission to manage collateral vault
  await collateralVault.grantRole(await collateralVault.SYNTHETIC_STOCK_ROLE(), syntheticStockAddress);
  console.log("✅ Granted CollateralVault role to SyntheticStock");
  
  // Grant DEXRouter permission to deposit to collateral vault
  await collateralVault.grantRole(await collateralVault.SYNTHETIC_STOCK_ROLE(), dexRouterAddress);
  console.log("✅ Granted CollateralVault role to DEXRouter");
  
  // Grant SmartAccount (AA) permission to call DEXRouter and SyntheticStock
  const dexRouterContract = DEXRouterFactory.attach(dexRouterAddress) as any;
  const syntheticStockContract = SyntheticStockFactory.attach(syntheticStockAddress) as any;
  
  await dexRouterContract.addAAWallet(smartAccountAddress);
  await syntheticStockContract.addAAWallet(smartAccountAddress);
  console.log("✅ Granted AA wallet permissions to DEXRouter and SyntheticStock");
  
  // Grant deployer oracle operator role for price updates
  await oracleAdapter.grantRole(await oracleAdapter.OPERATOR_ROLE(), deployer.address);
  console.log("✅ Granted Oracle operator role to deployer");

  // Fund Paymaster with some ETH for gas subsidies
  console.log("\n⛽ Funding Paymaster with ETH for gas subsidies...");
  const gasFundAmount = ethers.parseEther("0.1"); // 0.1 ETH
  const paymasterContract = PaymasterFactory.attach(paymasterAddress) as any;
  await paymasterContract.depositGas({ value: gasFundAmount });
  console.log("✅ Funded Paymaster with 0.1 ETH");

  // Whitelist tokens in DEXRouter for testing
  console.log("\n📝 Whitelisting tokens in DEXRouter...");
  await dexRouterContract.setTokenAllowance(mockUsdcAddress, true);
  await dexRouterContract.setTokenAllowance(aaplTokenAddress, true);
  await dexRouterContract.setTokenAllowance(mockOkbAddress, true);
  console.log("✅ Whitelisted USDC, AAPL-x, and OKB tokens in DEXRouter");

  // Set Initial AAPL Price per SDD requirements
  console.log("\n💰 Setting initial AAPL price...");
  const initialPrice = ethers.parseUnits("150.25", 8); // $150.25 with 8 decimals (per SDD)
  await oracleAdapter.pushPrice(initialPrice);
  console.log("✅ Set initial AAPL price to $150.25");

  // Test basic functionality per SDD requirements
  console.log("\n🧪 Testing basic functionality...");
  
  // Test MockUSDC
  const initialSupply = await mockUsdc.totalSupply();
  console.log(`✅ MockUSDC total supply: ${ethers.formatUnits(initialSupply, 6)} USDC`);
  
  // Test Oracle (per SDD section 6.2)
  const [currentPrice, ] = await oracleAdapter.getPrice();
  console.log(`✅ Current AAPL price: $${ethers.formatUnits(currentPrice, 8)}`);
  
  // Test AAPLToken roles
  const hasMinterRole = await aaplToken.hasRole(await aaplToken.MINTER_ROLE(), syntheticStockAddress);
  console.log(`✅ SyntheticStock has minter role: ${hasMinterRole}`);

  // Test system collateralization
  const systemRatio = await syntheticStockContract.getSystemCollateralizationRatio();
  console.log(`✅ System collateralization ratio: ${systemRatio}% (target: 150%)`);

  // Test Paymaster gas reserves
  const gasReserve = await paymasterContract.getGasReserve();
  console.log(`✅ Paymaster gas reserve: ${ethers.formatEther(gasReserve)} ETH`);

  // Test ZK Verifier
  const zkVerifierContract = ZKSolvencyVerifierFactory.attach(zkVerifierAddress) as any;
  const [isSolvent, collateralizationRatio, proofAge] = await zkVerifierContract.getSolvencyStatus();
  console.log(`✅ ZK Verifier - Solvent: ${isSolvent}, Ratio: ${collateralizationRatio}%, Proof Age: ${proofAge}s`);

  console.log("\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("==================================================");
  console.log("📊 COMPLETE SDD ARCHITECTURE DEPLOYMENT");
  console.log("==================================================");
  console.log(`MockUSDC:             ${mockUsdcAddress}`);
  console.log(`Mock OKB:             ${mockOkbAddress}`);
  console.log(`AAPLToken:            ${aaplTokenAddress}`);
  console.log(`OracleAdapter:        ${oracleAddress}`);
  console.log(`CollateralVault:      ${vaultAddress}`);
  console.log(`SyntheticStock:       ${syntheticStockAddress}`);
  console.log(`Paymaster:            ${paymasterAddress}`);
  console.log(`DEXRouter:            ${dexRouterAddress}`);
  console.log(`SmartAccount (AA):    ${smartAccountAddress}`);
  console.log(`ZKSolvencyVerifier:   ${zkVerifierAddress}`);
  console.log("==================================================");
  
  console.log("\n📋 Frontend Environment Variables:");
  console.log("Add these to your frontend/.env.local file:");
  console.log(`NEXT_PUBLIC_MOCK_USDC_ADDRESS=${mockUsdcAddress}`);
  console.log(`NEXT_PUBLIC_MOCK_OKB_ADDRESS=${mockOkbAddress}`);
  console.log(`NEXT_PUBLIC_AAPL_TOKEN_ADDRESS=${aaplTokenAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADAPTER_ADDRESS=${oracleAddress}`);
  console.log(`NEXT_PUBLIC_COLLATERAL_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`NEXT_PUBLIC_SYNTHETIC_STOCK_ADDRESS=${syntheticStockAddress}`);
  console.log(`NEXT_PUBLIC_PAYMASTER_ADDRESS=${paymasterAddress}`);
  console.log(`NEXT_PUBLIC_DEX_ROUTER_ADDRESS=${dexRouterAddress}`);
  console.log(`NEXT_PUBLIC_SMART_ACCOUNT_ADDRESS=${smartAccountAddress}`);
  console.log(`NEXT_PUBLIC_ZK_VERIFIER_ADDRESS=${zkVerifierAddress}`);

  console.log("\n🔄 Architecture Flow Test Commands:");
  console.log("# 1. Mint USDC to user:");
  console.log(`# await mockUsdc.faucet()`);
  console.log("# 2. Execute swap-and-mint via SmartAccount:");
  console.log(`# await smartAccount.swapAndMint(mockOkbAddress, amount, minUsdc, minAapl, swapData)`);
  console.log("# 3. Check AAPL-x balance:");
  console.log(`# await aaplToken.balanceOf(userAddress)`);
  console.log("# 4. Redeem and swap back:");
  console.log(`# await smartAccount.redeemAndSwap(aaplAmount, tokenOut, minOut, swapData)`);

  console.log("\n🏗️ Architecture Flow Summary:");
  console.log("Frontend → SmartAccount → DEXRouter → CollateralVault");
  console.log("Frontend → SmartAccount → SyntheticStock → AAPLToken");
  console.log("OracleUpdater → OracleAdapter → SyntheticStock");
  console.log("ZKProver → ZKSolvencyVerifier (solvency proofs)");
  console.log("Paymaster → SmartAccount (gasless UX)");

  console.log("\n✅ Complete SDD Architecture Deployment Successful!");
  console.log("📖 Next Steps:");
  console.log("1. Update frontend environment variables");
  console.log("2. Test the complete swap-and-mint flow");
  console.log("3. Set up oracle price updates (every 5 minutes per SDD)");
  console.log("4. Generate ZK solvency proofs (weekly per SDD)");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 