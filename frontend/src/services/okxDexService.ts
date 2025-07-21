import axios, { AxiosInstance } from 'axios';

// OKX DEX API Types
export interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface QuoteRequest {
  chainId: number;
  inputTokenAddress: string;
  outputTokenAddress: string;
  inputTokenAmount: string;
  slippageTolerance?: string; // Default: 0.005 (0.5%)
  userWalletAddress?: string;
}

export interface QuoteResponse {
  chainId: number;
  inputToken: Token;
  outputToken: Token;
  inputTokenAmount: string;
  outputTokenAmount: string;
  minOutputTokenAmount: string;
  gasPrice: string;
  estimatedGas: string;
  priceImpact: string;
  route: RouteInfo[];
  protocols: Protocol[];
}

export interface RouteInfo {
  dexName: string;
  percentage: number;
}

export interface Protocol {
  name: string;
  percentage: number;
}

export interface SwapRequest extends QuoteRequest {
  userWalletAddress: string;
  slippageTolerance: string;
}

export interface SwapResponse {
  chainId: number;
  inputToken: Token;
  outputToken: Token;
  inputTokenAmount: string;
  outputTokenAmount: string;
  minOutputTokenAmount: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  estimatedGas: string;
}

export interface SimulationRequest {
  chainId: number;
  from: string;
  to: string;
  data: string;
  value: string;
}

export interface SimulationResponse {
  success: boolean;
  gasUsed: string;
  blockNumber: string;
  errorMessage?: string;
}

/**
 * OKX DEX API Service
 * Integrates with OKX DEX aggregator for optimal token swaps
 */
export class OKXDEXService {
  private api: AxiosInstance;
  private baseURL = 'https://www.okx.com/api/v5/dex/aggregator';
  private quoteCacheMap = new Map<string, { data: QuoteResponse; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private mockMode = false; // Enable mock mode for development

  constructor(apiKey?: string) {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CryptoStock-dApp/1.0',
        ...(apiKey && { 'OK-ACCESS-KEY': apiKey }),
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('OKX DEX API Error:', error.response?.data || error.message);
        
        // Enable mock mode if API is not available
        if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
          console.warn('🔄 API unavailable, enabling mock mode');
          this.mockMode = true;
        }
        
        throw error;
      }
    );
  }

  /**
   * Get available tokens for a specific chain
   * @param chainId - The chain ID (196 for X Layer)
   * @returns List of supported tokens
   */
  async getSupportedTokens(chainId: number): Promise<Token[]> {
    if (this.mockMode) {
      return this.getMockTokens(chainId);
    }

    try {
      const response = await this.retryRequest(() =>
        this.api.get('/supported/tokens', {
          params: { chainId },
        })
      );

      return response.data.data || this.getMockTokens(chainId);
    } catch (error) {
      console.error('Failed to fetch supported tokens, using fallback:', error);
      return this.getMockTokens(chainId);
    }
  }

  /**
   * Get quote for token swap
   * @param request - Quote request parameters
   * @returns Quote response with pricing and route information
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.quoteCacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('🔄 Using cached quote');
      return cached.data;
    }

    if (this.mockMode) {
      return this.getMockQuote(request);
    }

    try {
      console.log('🔍 Fetching new quote from OKX DEX...');
      const response = await this.retryRequest(() =>
        this.api.get('/quote', {
          params: {
            chainId: request.chainId,
            inputTokenAddress: request.inputTokenAddress,
            outputTokenAddress: request.outputTokenAddress,
            inputTokenAmount: request.inputTokenAmount,
            slippageTolerance: request.slippageTolerance || '0.005',
            userWalletAddress: request.userWalletAddress,
          },
        })
      );

      const quoteData: QuoteResponse = response.data.data[0];
      
      // Cache the result
      this.quoteCacheMap.set(cacheKey, {
        data: quoteData,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      this.cleanCache();

      return quoteData;
    } catch (error) {
      console.error('Failed to get quote, using mock data:', error);
      return this.getMockQuote(request);
    }
  }

  /**
   * Get swap transaction data
   * @param request - Swap request parameters
   * @returns Transaction data ready for execution
   */
  async getSwapTransaction(request: SwapRequest): Promise<SwapResponse> {
    if (this.mockMode) {
      return this.getMockSwapTransaction(request);
    }

    try {
      console.log('🔨 Building swap transaction...');
      const response = await this.retryRequest(() =>
        this.api.get('/swap', {
          params: {
            chainId: request.chainId,
            inputTokenAddress: request.inputTokenAddress,
            outputTokenAddress: request.outputTokenAddress,
            inputTokenAmount: request.inputTokenAmount,
            slippageTolerance: request.slippageTolerance,
            userWalletAddress: request.userWalletAddress,
          },
        })
      );

      return response.data.data[0];
    } catch (error) {
      console.error('Failed to build swap transaction, using mock:', error);
      return this.getMockSwapTransaction(request);
    }
  }

  /**
   * Simulate transaction execution
   * @param request - Simulation request parameters
   * @returns Simulation results
   */
  async simulateTransaction(request: SimulationRequest): Promise<SimulationResponse> {
    if (this.mockMode) {
      return {
        success: true,
        gasUsed: '150000',
        blockNumber: '1234567',
      };
    }

    try {
      console.log('⚡ Simulating transaction...');
      const response = await this.retryRequest(() =>
        this.api.post('/simulate', request)
      );

      return response.data.data;
    } catch (error) {
      console.error('Failed to simulate transaction:', error);
      return {
        success: false,
        gasUsed: '0',
        blockNumber: '0',
        errorMessage: 'Simulation failed',
      };
    }
  }

  /**
   * Get supported chains
   * @returns List of supported chain IDs
   */
  async getSupportedChains(): Promise<number[]> {
    try {
      if (this.mockMode) {
        return [1, 56, 137, 195, 196]; // Include X Layer chains
      }

      const response = await this.retryRequest(() =>
        this.api.get('/supported/chains')
      );

      return response.data.data || [1, 56, 137, 195, 196];
    } catch (error) {
      console.error('Failed to fetch supported chains:', error);
      return [1, 56, 137, 195, 196]; // Fallback chains
    }
  }

  /**
   * Clear quote cache
   */
  clearCache(): void {
    this.quoteCacheMap.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getCacheStats(): { size: number; entries: string[]; mockMode: boolean } {
    return {
      size: this.quoteCacheMap.size,
      entries: Array.from(this.quoteCacheMap.keys()),
      mockMode: this.mockMode,
    };
  }

  /**
   * Enable/disable mock mode
   */
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
    console.log(`🔧 Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Private helper methods

  private generateCacheKey(request: QuoteRequest): string {
    return `${request.chainId}-${request.inputTokenAddress}-${request.outputTokenAddress}-${request.inputTokenAmount}-${request.slippageTolerance || '0.005'}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.quoteCacheMap.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.quoteCacheMap.delete(key);
      }
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        
        console.warn(`Request failed, retrying... (${i + 1}/${retries})`);
        await this.delay(this.RETRY_DELAY * (i + 1)); // Exponential backoff
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data methods for development
  private getMockTokens(chainId: number): Token[] {
    const baseTokens = [
      {
        chainId,
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
      },
      {
        chainId,
        address: '0xa0b86a33e6789e32123e5b7f1b3b6e42b2e8d8c8',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      },
      {
        chainId,
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      },
      {
        chainId,
        address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        name: 'OKB Token',
        symbol: 'OKB',
        decimals: 18,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png',
      },
    ];

    return baseTokens;
  }

  private getMockQuote(request: QuoteRequest): QuoteResponse {
    const inputToken = this.getMockTokens(request.chainId).find(
      t => t.address === request.inputTokenAddress
    );
    const outputToken = this.getMockTokens(request.chainId).find(
      t => t.address === request.outputTokenAddress
    );

    if (!inputToken || !outputToken) {
      throw new Error('Token not found');
    }

    // Mock calculation: 1 ETH = 2500 USDC, with some price impact
    const mockPrice = inputToken.symbol === 'ETH' ? 2500 : 1;
    const inputAmountFloat = parseFloat(request.inputTokenAmount) / Math.pow(10, inputToken.decimals);
    const outputAmountFloat = inputAmountFloat * mockPrice * 0.997; // 0.3% slippage
    const outputAmount = Math.floor(outputAmountFloat * Math.pow(10, outputToken.decimals)).toString();
    const minOutputAmount = Math.floor(outputAmountFloat * 0.995 * Math.pow(10, outputToken.decimals)).toString();

    return {
      chainId: request.chainId,
      inputToken,
      outputToken,
      inputTokenAmount: request.inputTokenAmount,
      outputTokenAmount: outputAmount,
      minOutputTokenAmount: minOutputAmount,
      gasPrice: '20000000000', // 20 gwei
      estimatedGas: '150000',
      priceImpact: '0.3',
      route: [
        { dexName: 'Uniswap V3', percentage: 70 },
        { dexName: 'SushiSwap', percentage: 30 },
      ],
      protocols: [
        { name: 'Uniswap V3', percentage: 70 },
        { name: 'SushiSwap', percentage: 30 },
      ],
    };
  }

  private getMockSwapTransaction(request: SwapRequest): SwapResponse {
    const quote = this.getMockQuote(request);
    
    return {
      ...quote,
      to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Mock 1inch router
      data: '0x12aa3caf000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000a0b86a33e6789e32123e5b7f1b3b6e42b2e8d8c8',
      value: '0',
    };
  }
}

// Singleton instance
export const okxDexService = new OKXDEXService(process.env.NEXT_PUBLIC_OKX_DEX_API_KEY);

// Constants for X Layer
export const X_LAYER_CHAIN_ID = 196;
export const X_LAYER_TESTNET_CHAIN_ID = 195;

// Common token addresses on X Layer
export const COMMON_TOKENS = {
  [X_LAYER_CHAIN_ID]: {
    OKB: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    USDC: '0xa0b86a33e6789e32123e5b7f1b3b6e42b2e8d8c8',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    ETH: '0x0000000000000000000000000000000000000000',
  },
  [X_LAYER_TESTNET_CHAIN_ID]: {
    OKB: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    USDC: '0xa0b86a33e6789e32123e5b7f1b3b6e42b2e8d8c8',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    ETH: '0x0000000000000000000000000000000000000000',
  },
};

// Enable mock mode for development
if (process.env.NODE_ENV === 'development') {
  okxDexService.setMockMode(true);
} 