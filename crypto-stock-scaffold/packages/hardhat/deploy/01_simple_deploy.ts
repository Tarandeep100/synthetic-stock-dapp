import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Simplified deployment without proxies to get the dApp running quickly
 */
const deploySimple: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Simple Deployment - No Proxies");
  
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying with account:", deployer);

  // 1. Deploy MockUSDC
  console.log("\n📄 Deploying MockUSDC...");
  const mockUsdcDeployment = await deploy("MockUSDC", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 2. Deploy AAPLToken
  console.log("\n📄 Deploying AAPLToken...");
  const aaplTokenDeployment = await deploy("AAPLToken", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 3. Deploy OracleAdapter (without proxy)
  console.log("\n📄 Deploying OracleAdapter (simple)...");
  const oracleAdapterDeployment = await deploy("OracleAdapterSimple", {
    from: deployer,
    contract: "OracleAdapter",
    args: [],
    log: true,
    autoMine: true,
  });

  // Initialize OracleAdapter
  const oracleAdapter = await hre.ethers.getContractAt("OracleAdapter", oracleAdapterDeployment.address);
  if (oracleAdapter.initialize) {
    try {
      await oracleAdapter.initialize(deployer);
      console.log("✅ OracleAdapter initialized");
    } catch (error) {
      console.log("⚠️ OracleAdapter already initialized or doesn't need initialization");
    }
  }

  // 4. Deploy CollateralVault
  console.log("\n📄 Deploying CollateralVault...");
  const collateralVaultDeployment = await deploy("CollateralVault", {
    from: deployer,
    args: [mockUsdcDeployment.address, deployer],
    log: true,
    autoMine: true,
  });

  // 5. Deploy SyntheticStock (without proxy)
  console.log("\n📄 Deploying SyntheticStock (simple)...");
  const syntheticStockDeployment = await deploy("SyntheticStockSimple", {
    from: deployer,
    contract: "SyntheticStock",
    args: [],
    log: true,
    autoMine: true,
  });

  // Initialize SyntheticStock
  const syntheticStock = await hre.ethers.getContractAt("SyntheticStock", syntheticStockDeployment.address);
  if (syntheticStock.initialize) {
    try {
      await syntheticStock.initialize(
        aaplTokenDeployment.address,
        collateralVaultDeployment.address,
        oracleAdapterDeployment.address,
        mockUsdcDeployment.address,
        deployer
      );
      console.log("✅ SyntheticStock initialized");
    } catch (error) {
      console.log("⚠️ SyntheticStock already initialized");
    }
  }

  // 6. Deploy DEXRouter
  console.log("\n📄 Deploying DEXRouter...");
  const dexRouterDeployment = await deploy("DEXRouter", {
    from: deployer,
    args: [collateralVaultDeployment.address, mockUsdcDeployment.address],
    log: true,
    autoMine: true,
  });

  // 7. Deploy Paymaster
  console.log("\n📄 Deploying Paymaster...");
  const paymasterDeployment = await deploy("Paymaster", {
    from: deployer,
    args: [mockUsdcDeployment.address, mockUsdcDeployment.address], // Using USDC for both USDC and OKB for simplicity
    log: true,
    autoMine: true,
  });

  // 8. Deploy ZKSolvencyVerifier
  console.log("\n📄 Deploying ZKSolvencyVerifier...");
  const zkVerifierDeployment = await deploy("ZKSolvencyVerifier", {
    from: deployer,
    args: [syntheticStockDeployment.address],
    log: true,
    autoMine: true,
  });

  console.log("\n🎉 Simple deployment completed!");
  console.log("Contract addresses:");
  console.log("- MockUSDC:", mockUsdcDeployment.address);
  console.log("- AAPLToken:", aaplTokenDeployment.address);
  console.log("- OracleAdapter:", oracleAdapterDeployment.address);
  console.log("- CollateralVault:", collateralVaultDeployment.address);
  console.log("- SyntheticStock:", syntheticStockDeployment.address);
  console.log("- DEXRouter:", dexRouterDeployment.address);
  console.log("- Paymaster:", paymasterDeployment.address);
  console.log("- ZKSolvencyVerifier:", zkVerifierDeployment.address);

  console.log("\n✅ Ready to start frontend!");
};

export default deploySimple;
deploySimple.tags = ["SimpleDeployment"]; 