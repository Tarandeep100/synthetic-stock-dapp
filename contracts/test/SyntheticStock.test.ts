import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  MockUSDC, 
  AAPLToken, 
  OracleAdapter, 
  CollateralVault, 
  SyntheticStock 
} from "../typechain-types";

describe("SyntheticStock", function () {
  let mockUsdc: MockUSDC;
  let aaplToken: AAPLToken;
  let oracle: OracleAdapter;
  let collateralVault: CollateralVault;
  let syntheticStock: SyntheticStock;
  
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const INITIAL_AAPL_PRICE = ethers.parseUnits("150", 8); // $150.00 with 8 decimals
  const USDC_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC with 6 decimals

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDCFactory.deploy(owner.address);
    await mockUsdc.waitForDeployment();

    // Deploy AAPLToken
    const AAPLTokenFactory = await ethers.getContractFactory("AAPLToken");
    aaplToken = await AAPLTokenFactory.deploy(owner.address);
    await aaplToken.waitForDeployment();

    // Deploy OracleAdapter
    const OracleAdapterFactory = await ethers.getContractFactory("OracleAdapter");
    oracle = await OracleAdapterFactory.deploy();
    await oracle.waitForDeployment();
    await oracle.initialize(owner.address);

    // Deploy CollateralVault
    const CollateralVaultFactory = await ethers.getContractFactory("CollateralVault");
    collateralVault = await CollateralVaultFactory.deploy(
      await mockUsdc.getAddress(),
      owner.address
    );
    await collateralVault.waitForDeployment();

    // Deploy SyntheticStock
    const SyntheticStockFactory = await ethers.getContractFactory("SyntheticStock");
    syntheticStock = await SyntheticStockFactory.deploy();
    await syntheticStock.waitForDeployment();
    
    await syntheticStock.initialize(
      await aaplToken.getAddress(),
      await collateralVault.getAddress(),
      await oracle.getAddress(),
      await mockUsdc.getAddress(),
      owner.address
    );

    // Setup roles
    await aaplToken.grantRole(await aaplToken.MINTER_ROLE(), await syntheticStock.getAddress());
    await aaplToken.grantRole(await aaplToken.BURNER_ROLE(), await syntheticStock.getAddress());
    await collateralVault.grantRole(
      await collateralVault.SYNTHETIC_STOCK_ROLE(), 
      await syntheticStock.getAddress()
    );
    await oracle.grantRole(await oracle.OPERATOR_ROLE(), owner.address);

    // Set initial price
    await oracle.pushPrice(INITIAL_AAPL_PRICE);

    // Give users some USDC
    await mockUsdc.mint(user1.address, USDC_AMOUNT);
    await mockUsdc.mint(user2.address, USDC_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await syntheticStock.version()).to.equal("1.0.0");
      expect(await syntheticStock.COLLATERAL_RATIO()).to.equal(ethers.parseEther("150"));
      expect(await syntheticStock.mintFee()).to.equal(25);
      expect(await syntheticStock.redeemFee()).to.equal(25);
    });

    it("Should have correct contract addresses", async function () {
      expect(await syntheticStock.aaplToken()).to.equal(await aaplToken.getAddress());
      expect(await syntheticStock.collateralVault()).to.equal(await collateralVault.getAddress());
      expect(await syntheticStock.oracle()).to.equal(await oracle.getAddress());
      expect(await syntheticStock.usdcToken()).to.equal(await mockUsdc.getAddress());
    });
  });

  describe("Minting", function () {
    it("Should mint AAPL-x tokens when depositing USDC", async function () {
      const mintAmount = ethers.parseUnits("300", 6); // 300 USDC
      
      // Approve USDC spending
      await mockUsdc.connect(user1).approve(await syntheticStock.getAddress(), mintAmount);
      
      // Get initial balances
      const initialUsdcBalance = await mockUsdc.balanceOf(user1.address);
      const initialAaplBalance = await aaplToken.balanceOf(user1.address);
      
      // Mint AAPL-x
      const tx = await syntheticStock.connect(user1).mint(mintAmount);
      const receipt = await tx.wait();
      
      // Check balances changed
      const finalUsdcBalance = await mockUsdc.balanceOf(user1.address);
      const finalAaplBalance = await aaplToken.balanceOf(user1.address);
      
      expect(finalUsdcBalance).to.be.lt(initialUsdcBalance);
      expect(finalAaplBalance).to.be.gt(initialAaplBalance);
      
      // Check events
      expect(receipt?.logs).to.not.be.empty;
    });

    it("Should reject minting with zero amount", async function () {
      await expect(
        syntheticStock.connect(user1).mint(0)
      ).to.be.revertedWith("SyntheticStock: amount must be positive");
    });

    it("Should reject minting without sufficient allowance", async function () {
      const mintAmount = ethers.parseUnits("300", 6);
      
      await expect(
        syntheticStock.connect(user1).mint(mintAmount)
      ).to.be.reverted;
    });
  });

  describe("Price Oracle", function () {
    it("Should get the current AAPL price", async function () {
      const [price, lastUpdated] = await oracle.getPrice();
      expect(price).to.equal(INITIAL_AAPL_PRICE);
      expect(lastUpdated).to.be.gt(0);
    });

    it("Should update price with operator role", async function () {
      const newPrice = ethers.parseUnits("155", 8); // $155.00
      
      await oracle.pushPrice(newPrice);
      const [price] = await oracle.getPrice();
      expect(price).to.equal(newPrice);
    });

    it("Should reject price updates from non-operators", async function () {
      const newPrice = ethers.parseUnits("155", 8);
      
      await expect(
        oracle.connect(user1).pushPrice(newPrice)
      ).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should have correct admin role", async function () {
      const adminRole = await syntheticStock.DEFAULT_ADMIN_ROLE();
      expect(await syntheticStock.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should allow admin to update fees", async function () {
      const newMintFee = 50; // 0.5%
      const newRedeemFee = 50;
      
      await syntheticStock.updateFees(newMintFee, newRedeemFee);
      
      expect(await syntheticStock.mintFee()).to.equal(newMintFee);
      expect(await syntheticStock.redeemFee()).to.equal(newRedeemFee);
    });

    it("Should reject fee updates from non-admin", async function () {
      await expect(
        syntheticStock.connect(user1).updateFees(50, 50)
      ).to.be.reverted;
    });
  });
}); 