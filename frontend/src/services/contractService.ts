import { ethers } from 'ethers';
import { Address } from 'viem';

// Contract ABIs (simplified for demo - in production these would be imported from build artifacts)
const SYNTHETIC_STOCK_ABI = [
  'function mint(uint256 amount) external',
  'function redeem(uint256 amount) external',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function getCollateralRatio() view returns (uint256)',
  'function getRequiredCollateral(uint256 amount) view returns (uint256)',
  'event Mint(address indexed user, uint256 amount, uint256 collateralUsed)',
  'event Redeem(address indexed user, uint256 amount, uint256 collateralReturned)',
];

const ORACLE_ADAPTER_ABI = [
  'function getPrice() view returns (uint256)',
  'function lastUpdateTime() view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const COLLATERAL_VAULT_ABI = [
  'function getTotalCollateral() view returns (uint256)',
  'function getVaultBalance() view returns (uint256)',
  'function getUserDeposit(address user) view returns (uint256)',
];

const MOCK_USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const AAPL_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Contract addresses (these would be loaded from environment variables)
export const CONTRACT_ADDRESSES = {
  SYNTHETIC_STOCK: process.env.NEXT_PUBLIC_SYNTHETIC_STOCK_ADDRESS || '',
  ORACLE_ADAPTER: process.env.NEXT_PUBLIC_ORACLE_ADAPTER_ADDRESS || '',
  COLLATERAL_VAULT: process.env.NEXT_PUBLIC_COLLATERAL_VAULT_ADDRESS || '',
  AAPL_TOKEN: process.env.NEXT_PUBLIC_AAPL_TOKEN_ADDRESS || '',
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '',
};

export interface ContractData {
  aaplPrice: string;
  aaplBalance: string;
  usdcBalance: string;
  totalSupply: string;
  collateralRatio: string;
  vaultBalance: string;
  userDeposit: string;
}

export interface MintParams {
  amount: string; // Amount of AAPL-x tokens to mint
  maxCollateral: string; // Maximum USDC willing to spend
}

export interface RedeemParams {
  amount: string; // Amount of AAPL-x tokens to redeem
  minCollateral: string; // Minimum USDC expected to receive
}

/**
 * Service for interacting with our smart contracts
 */
export class ContractService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider || null;
    this.signer = signer || null;
  }

  /**
   * Update provider and signer
   */
  updateProvider(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
  }

  /**
   * Get all contract data for the dashboard
   */
  async getContractData(userAddress?: string): Promise<ContractData> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // Create contract instances
      const oracleContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ORACLE_ADAPTER,
        ORACLE_ADAPTER_ABI,
        this.provider
      );

      const aaplTokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.AAPL_TOKEN,
        AAPL_TOKEN_ABI,
        this.provider
      );

      const usdcContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MOCK_USDC,
        MOCK_USDC_ABI,
        this.provider
      );

      const vaultContract = new ethers.Contract(
        CONTRACT_ADDRESSES.COLLATERAL_VAULT,
        COLLATERAL_VAULT_ABI,
        this.provider
      );

      const syntheticContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
        SYNTHETIC_STOCK_ABI,
        this.provider
      );

      // Parallel contract calls
      const [
        aaplPrice,
        aaplBalance,
        usdcBalance,
        totalSupply,
        collateralRatio,
        vaultBalance,
        userDeposit,
      ] = await Promise.all([
        oracleContract.getPrice().catch(() => ethers.parseUnits('150', 8)), // Fallback price
        userAddress ? aaplTokenContract.balanceOf(userAddress).catch(() => BigInt(0)) : BigInt(0),
        userAddress ? usdcContract.balanceOf(userAddress).catch(() => BigInt(0)) : BigInt(0),
        aaplTokenContract.totalSupply().catch(() => BigInt(0)),
        syntheticContract.getCollateralRatio().catch(() => ethers.parseUnits('1.5', 18)), // 150%
        vaultContract.getVaultBalance().catch(() => BigInt(0)),
        userAddress ? vaultContract.getUserDeposit(userAddress).catch(() => BigInt(0)) : BigInt(0),
      ]);

      return {
        aaplPrice: ethers.formatUnits(aaplPrice, 8), // Oracle price is 8 decimals
        aaplBalance: ethers.formatUnits(aaplBalance, 18),
        usdcBalance: ethers.formatUnits(usdcBalance, 6),
        totalSupply: ethers.formatUnits(totalSupply, 18),
        collateralRatio: ethers.formatUnits(collateralRatio, 18),
        vaultBalance: ethers.formatUnits(vaultBalance, 6),
        userDeposit: ethers.formatUnits(userDeposit, 6),
      };
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
      
      // Return fallback data for demo
      return {
        aaplPrice: '150.25',
        aaplBalance: userAddress ? '0.0' : '0.0',
        usdcBalance: userAddress ? '0.0' : '0.0',
        totalSupply: '1000.0',
        collateralRatio: '1.62',
        vaultBalance: '2400000.0',
        userDeposit: userAddress ? '0.0' : '0.0',
      };
    }
  }

  /**
   * Mint AAPL-x tokens
   */
  async mintAaplTokens(params: MintParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const syntheticContract = new ethers.Contract(
      CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
      SYNTHETIC_STOCK_ABI,
      this.signer
    );

    const usdcContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDC,
      MOCK_USDC_ABI,
      this.signer
    );

    // First approve USDC spending
    const approvalTx = await usdcContract.approve(
      CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
      ethers.parseUnits(params.maxCollateral, 6)
    );
    await approvalTx.wait();

    // Then mint AAPL-x tokens
    const mintTx = await syntheticContract.mint(
      ethers.parseUnits(params.amount, 18)
    );

    return mintTx.hash;
  }

  /**
   * Redeem AAPL-x tokens for USDC
   */
  async redeemAaplTokens(params: RedeemParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const syntheticContract = new ethers.Contract(
      CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
      SYNTHETIC_STOCK_ABI,
      this.signer
    );

    const redeemTx = await syntheticContract.redeem(
      ethers.parseUnits(params.amount, 18)
    );

    return redeemTx.hash;
  }

  /**
   * Get required collateral for minting
   */
  async getRequiredCollateral(aaplAmount: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const syntheticContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
        SYNTHETIC_STOCK_ABI,
        this.provider
      );

      const requiredCollateral = await syntheticContract.getRequiredCollateral(
        ethers.parseUnits(aaplAmount, 18)
      );

      return ethers.formatUnits(requiredCollateral, 6);
    } catch (error) {
      console.error('Failed to get required collateral:', error);
      
      // Fallback calculation: AAPL amount * price * collateral ratio
      const aaplPrice = 150.25;
      const collateralRatio = 1.5;
      const requiredUsdc = parseFloat(aaplAmount) * aaplPrice * collateralRatio;
      
      return requiredUsdc.toFixed(6);
    }
  }

  /**
   * Check USDC allowance for the synthetic stock contract
   */
  async getUsdcAllowance(userAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const usdcContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MOCK_USDC,
        MOCK_USDC_ABI,
        this.provider
      );

      const allowance = await usdcContract.allowance(
        userAddress,
        CONTRACT_ADDRESSES.SYNTHETIC_STOCK
      );

      return ethers.formatUnits(allowance, 6);
    } catch (error) {
      console.error('Failed to get USDC allowance:', error);
      return '0';
    }
  }

  /**
   * Approve USDC spending
   */
  async approveUsdc(amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const usdcContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDC,
      MOCK_USDC_ABI,
      this.signer
    );

    const approveTx = await usdcContract.approve(
      CONTRACT_ADDRESSES.SYNTHETIC_STOCK,
      ethers.parseUnits(amount, 6)
    );

    return approveTx.hash;
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  /**
   * Check if contracts are deployed (have addresses)
   */
  areContractsDeployed(): boolean {
    return Object.values(CONTRACT_ADDRESSES).every(address => address !== '');
  }
}

// Export singleton instance
export const contractService = new ContractService(); 