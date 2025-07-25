import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Deploys the complete Synthetic Stock dApp architecture per SDD requirements
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySyntheticStockArchitecture: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting deployment of Synthetic Stock dApp (Complete SDD Architecture)...");
  
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying contracts with account:", deployer);

  // 1. Deploy MockUSDC (testnet USDC with 6 decimals per SDD)
  console.log("\n📄 Deploying MockUSDC...");
  const mockUsdcDeployment = await deploy("MockUSDC", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 2. Deploy Mock OKB Token (reusing MockUSDC structure)
  console.log("\n📄 Deploying Mock OKB Token...");
  const mockOkbDeployment = await deploy("MockOKB", {
    from: deployer,
    contract: "MockUSDC", // Reuse MockUSDC contract
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 3. Deploy AAPLToken (synthetic AAPL with 18 decimals per SDD)
  console.log("\n📄 Deploying AAPLToken...");
  const aaplTokenDeployment = await deploy("AAPLToken", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 4. Deploy OracleAdapter (with proxy for upgradeability)
  console.log("\n📄 Deploying OracleAdapter...");
  const oracleAdapterDeployment = await deploy("OracleAdapter", {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [deployer],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  // 5. Deploy CollateralVault
  console.log("\n📄 Deploying CollateralVault...");
  const collateralVaultDeployment = await deploy("CollateralVault", {
    from: deployer,
    args: [mockUsdcDeployment.address, deployer],
    log: true,
    autoMine: true,
  });

  // 6. Deploy SyntheticStock (main contract with proxy)
  console.log("\n📄 Deploying SyntheticStock...");
  const syntheticStockDeployment = await deploy("SyntheticStock", {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [
            aaplTokenDeployment.address,
            collateralVaultDeployment.address,
            oracleAdapterDeployment.address,
            mockUsdcDeployment.address,
            deployer,
          ],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  // 7. Deploy Paymaster for gasless UX (per SDD FR-4)
  console.log("\n📄 Deploying Paymaster...");
  const paymasterDeployment = await deploy("Paymaster", {
    from: deployer,
    args: [
      mockUsdcDeployment.address,
      mockOkbDeployment.address,
      deployer,
    ],
    log: true,
    autoMine: true,
  });

  // 8. Deploy DEXRouter (per SDD FR-6)
  console.log("\n📄 Deploying DEXRouter...");
  const mockOKXAggregator = "0x1000000000000000000000000000000000000001"; // Placeholder
  const dexRouterDeployment = await deploy("DEXRouter", {
    from: deployer,
    args: [
      collateralVaultDeployment.address,
      mockUsdcDeployment.address,
      mockOKXAggregator,
      deployer,
    ],
    log: true,
    autoMine: true,
  });

  // 9. Deploy ZKSolvencyVerifier
  console.log("\n📄 Deploying ZKSolvencyVerifier...");
  const zkVerifierDeployment = await deploy("ZKSolvencyVerifier", {
    from: deployer,
    args: [syntheticStockDeployment.address, deployer],
    log: true,
    autoMine: true,
  });

  // 10. Deploy SmartAccount (Account Abstraction)
  console.log("\n📄 Deploying SmartAccount...");
  const guardians = [
    "0x2000000000000000000000000000000000000001",
    "0x2000000000000000000000000000000000000002",
    "0x2000000000000000000000000000000000000003",
  ];
  const smartAccountDeployment = await deploy("SmartAccount", {
    from: deployer,
    args: [
      deployer,
      guardians,
      dexRouterDeployment.address,
      syntheticStockDeployment.address,
    ],
    log: true,
    autoMine: true,
  });

  // Setup Permissions and Architecture Flow
  console.log("\n🔧 Setting up permissions and architecture flow...");

  // Get contract instances
  const aaplToken = await hre.ethers.getContract("AAPLToken", deployer);
  const collateralVault = await hre.ethers.getContract("CollateralVault", deployer);
  const syntheticStock = await hre.ethers.getContract("SyntheticStock", deployer);
  const dexRouter = await hre.ethers.getContract("DEXRouter", deployer);
  const oracleAdapter = await hre.ethers.getContract("OracleAdapter", deployer);
  const paymaster = await hre.ethers.getContract("Paymaster", deployer);
  const mockUsdc = await hre.ethers.getContract("MockUSDC", deployer);

  // Grant roles for AAPL token
  const MINTER_ROLE = await aaplToken.MINTER_ROLE();
  const BURNER_ROLE = await aaplToken.BURNER_ROLE();
  await aaplToken.grantRole(MINTER_ROLE, syntheticStockDeployment.address);
  await aaplToken.grantRole(BURNER_ROLE, syntheticStockDeployment.address);
  console.log("✅ Granted AAPL token mint/burn roles to SyntheticStock");

  // Grant vault permissions
  const SYNTHETIC_STOCK_ROLE = await collateralVault.SYNTHETIC_STOCK_ROLE();
  await collateralVault.grantRole(SYNTHETIC_STOCK_ROLE, syntheticStockDeployment.address);
  await collateralVault.grantRole(SYNTHETIC_STOCK_ROLE, dexRouterDeployment.address);
  console.log("✅ Granted CollateralVault roles to SyntheticStock and DEXRouter");

  // Grant AA permissions
  await dexRouter.addAAWallet(smartAccountDeployment.address);
  await syntheticStock.addAAWallet(smartAccountDeployment.address);
  console.log("✅ Granted AA wallet permissions to DEXRouter and SyntheticStock");

  // Grant oracle operator role
  const OPERATOR_ROLE = await oracleAdapter.OPERATOR_ROLE();
  await oracleAdapter.grantRole(OPERATOR_ROLE, deployer);
  console.log("✅ Granted Oracle operator role to deployer");

  // Fund Paymaster with ETH
  console.log("\n⛽ Funding Paymaster with ETH for gas subsidies...");
  const gasFundAmount = ethers.parseEther("0.1");
  await paymaster.depositGas({ value: gasFundAmount });
  console.log("✅ Funded Paymaster with 0.1 ETH");

  // Whitelist tokens in DEXRouter
  console.log("\n📝 Whitelisting tokens in DEXRouter...");
  await dexRouter.setTokenAllowance(mockUsdcDeployment.address, true);
  await dexRouter.setTokenAllowance(aaplTokenDeployment.address, true);
  await dexRouter.setTokenAllowance(mockOkbDeployment.address, true);
  console.log("✅ Whitelisted USDC, AAPL-x, and OKB tokens in DEXRouter");

  // Set initial AAPL price
  console.log("\n💰 Setting initial AAPL price...");
  const initialPrice = ethers.parseUnits("150.25", 8); // $150.25 with 8 decimals
  await oracleAdapter.pushPrice(initialPrice);
  console.log("✅ Set initial AAPL price to $150.25");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  const [currentPrice] = await oracleAdapter.getPrice();
  console.log(`✅ Current AAPL price: $${ethers.formatUnits(currentPrice, 8)}`);

  const systemRatio = await syntheticStock.getSystemCollateralizationRatio();
  console.log(`✅ System collateralization ratio: ${systemRatio}% (target: 150%)`);

  const gasReserve = await paymaster.getGasReserve();
  console.log(`✅ Paymaster gas reserve: ${ethers.formatEther(gasReserve)} ETH`);

  console.log("\n🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("==================================================");
  console.log("📊 COMPLETE SDD ARCHITECTURE DEPLOYMENT");
  console.log("==================================================");
  console.log(`MockUSDC:             ${mockUsdcDeployment.address}`);
  console.log(`Mock OKB:             ${mockOkbDeployment.address}`);
  console.log(`AAPLToken:            ${aaplTokenDeployment.address}`);
  console.log(`OracleAdapter:        ${oracleAdapterDeployment.address}`);
  console.log(`CollateralVault:      ${collateralVaultDeployment.address}`);
  console.log(`SyntheticStock:       ${syntheticStockDeployment.address}`);
  console.log(`Paymaster:            ${paymasterDeployment.address}`);
  console.log(`DEXRouter:            ${dexRouterDeployment.address}`);
  console.log(`SmartAccount (AA):    ${smartAccountDeployment.address}`);
  console.log(`ZKSolvencyVerifier:   ${zkVerifierDeployment.address}`);
  console.log("==================================================");

  console.log("\n🏗️ Architecture Flow Summary:");
  console.log("Frontend → SmartAccount → DEXRouter → CollateralVault");
  console.log("Frontend → SmartAccount → SyntheticStock → AAPLToken");
  console.log("OracleUpdater → OracleAdapter → SyntheticStock");
  console.log("ZKProver → ZKSolvencyVerifier (solvency proofs)");
  console.log("Paymaster → SmartAccount (gasless UX)");

  console.log("\n✅ Complete SDD Architecture Deployment Successful!");
  console.log("🔄 Test the flow:");
  console.log("1. Visit http://localhost:3000/debug to interact with contracts");
  console.log("2. Test swap-and-mint via SmartAccount");
  console.log("3. Monitor system collateralization ratio");
  console.log("4. Submit ZK solvency proofs weekly");
};

export default deploySyntheticStockArchitecture;

deploySyntheticStockArchitecture.tags = [
  "SyntheticStock",
  "MockUSDC", 
  "AAPLToken",
  "OracleAdapter",
  "CollateralVault",
  "Paymaster",
  "DEXRouter",
  "SmartAccount",
  "ZKSolvencyVerifier"
];
