import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { 
  okxDexService, 
  QuoteResponse, 
  SwapResponse, 
  Token,
  X_LAYER_CHAIN_ID,
  X_LAYER_TESTNET_CHAIN_ID,
  COMMON_TOKENS 
} from '../services/okxDexService';

export interface SwapAndMintState {
  // Token selection
  inputToken: Token | null;
  outputToken: Token | null; // Always USDC for our use case
  inputAmount: string;
  
  // Quote data
  quote: QuoteResponse | null;
  isLoadingQuote: boolean;
  quoteError: string | null;
  
  // Transaction state
  isSwapping: boolean;
  isMinting: boolean;
  swapTxHash: string | null;
  mintTxHash: string | null;
  
  // UI state
  slippageTolerance: string;
  showAdvanced: boolean;
}

export interface SwapAndMintActions {
  // Token selection
  setInputToken: (token: Token | null) => void;
  setInputAmount: (amount: string) => void;
  setSlippageTolerance: (tolerance: string) => void;
  setShowAdvanced: (show: boolean) => void;
  
  // Quote actions
  getQuote: () => Promise<void>;
  refreshQuote: () => Promise<void>;
  
  // Transaction actions
  executeSwapAndMint: () => Promise<void>;
  reset: () => void;
}

export function useSwapAndMint() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Determine which chain to use
  const currentChainId = chain?.id === X_LAYER_CHAIN_ID ? X_LAYER_CHAIN_ID : X_LAYER_TESTNET_CHAIN_ID;

  // Set USDC as default output token based on current chain
  const usdcToken: Token = {
    chainId: currentChainId,
    address: COMMON_TOKENS[currentChainId]?.USDC || '0xa0b86a33e6789e32123e5b7f1b3b6e42b2e8d8c8',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  };

  // State
  const [state, setState] = useState<SwapAndMintState>({
    inputToken: null,
    outputToken: usdcToken,
    inputAmount: '',
    quote: null,
    isLoadingQuote: false,
    quoteError: null,
    isSwapping: false,
    isMinting: false,
    swapTxHash: null,
    mintTxHash: null,
    slippageTolerance: '0.005', // 0.5%
    showAdvanced: false,
  });

  // Update output token when chain changes
  useEffect(() => {
    setState(prev => ({ ...prev, outputToken: usdcToken }));
  }, [currentChainId]);

  // Actions
  const setInputToken = useCallback((token: Token | null) => {
    setState(prev => ({ 
      ...prev, 
      inputToken: token,
      quote: null,
      quoteError: null 
    }));
  }, []);

  const setInputAmount = useCallback((amount: string) => {
    setState(prev => ({ 
      ...prev, 
      inputAmount: amount,
      quote: null,
      quoteError: null 
    }));
  }, []);

  const setSlippageTolerance = useCallback((tolerance: string) => {
    setState(prev => ({ ...prev, slippageTolerance: tolerance }));
  }, []);

  const setShowAdvanced = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showAdvanced: show }));
  }, []);

  const getQuote = useCallback(async () => {
    if (!state.inputToken || !state.inputAmount || !address) {
      return;
    }

    // Validate input amount
    const amountFloat = parseFloat(state.inputAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setState(prev => ({ 
        ...prev, 
        quoteError: 'Please enter a valid amount' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoadingQuote: true, quoteError: null }));

    try {
      // Convert input amount to proper units
      const inputAmountWei = parseUnits(state.inputAmount, state.inputToken.decimals);

      console.log('🔍 Getting quote for:', {
        from: state.inputToken.symbol,
        to: usdcToken.symbol,
        amount: state.inputAmount,
        chainId: currentChainId
      });

      const quote = await okxDexService.getQuote({
        chainId: currentChainId,
        inputTokenAddress: state.inputToken.address,
        outputTokenAddress: usdcToken.address,
        inputTokenAmount: inputAmountWei.toString(),
        slippageTolerance: state.slippageTolerance,
        userWalletAddress: address,
      });

      setState(prev => ({ ...prev, quote, isLoadingQuote: false }));
      console.log('✅ Quote received:', quote);

    } catch (error) {
      console.error('Failed to get quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setState(prev => ({ 
        ...prev, 
        isLoadingQuote: false,
        quoteError: errorMessage
      }));
    }
  }, [state.inputToken, state.inputAmount, state.slippageTolerance, address, currentChainId]);

  const refreshQuote = useCallback(async () => {
    okxDexService.clearCache();
    await getQuote();
  }, [getQuote]);

  const executeSwapAndMint = useCallback(async () => {
    if (!state.inputToken || !state.quote || !address || !walletClient) {
      throw new Error('Missing required data for swap and mint');
    }

    try {
      setState(prev => ({ ...prev, isSwapping: true, quoteError: null }));

      console.log('🚀 Starting swap and mint process...');

      // Step 1: Get swap transaction data
      const swapTx = await okxDexService.getSwapTransaction({
        chainId: currentChainId,
        inputTokenAddress: state.inputToken.address,
        outputTokenAddress: usdcToken.address,
        inputTokenAmount: parseUnits(state.inputAmount, state.inputToken.decimals).toString(),
        slippageTolerance: state.slippageTolerance,
        userWalletAddress: address,
      });

      console.log('📝 Swap transaction prepared:', {
        to: swapTx.to,
        expectedOutput: formatUnits(BigInt(swapTx.outputTokenAmount), 6) + ' USDC'
      });

      // Step 2: Execute swap transaction
      console.log('🔄 Executing swap transaction...');
      
      // For development/mock mode, simulate the transaction
      if (okxDexService.getCacheStats().mockMode) {
        console.log('🎭 Mock mode: Simulating swap transaction...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockSwapHash = '0x' + Math.random().toString(16).substr(2, 64);
        setState(prev => ({ ...prev, swapTxHash: mockSwapHash }));
      } else {
        const swapHash = await walletClient.sendTransaction({
          to: swapTx.to as Address,
          data: swapTx.data as `0x${string}`,
          value: BigInt(swapTx.value),
          gas: BigInt(swapTx.estimatedGas),
          gasPrice: BigInt(swapTx.gasPrice),
        });

        setState(prev => ({ ...prev, swapTxHash: swapHash }));

        // Wait for swap confirmation
        console.log('⏳ Waiting for swap confirmation...');
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
          console.log('✅ Swap confirmed:', receipt.status);
        }
      }

      setState(prev => ({ ...prev, isSwapping: false, isMinting: true }));

      // Step 3: Execute mint transaction (preparation for SyntheticStock contract integration)
      console.log('🪙 Executing mint transaction...');
      
      // Calculate expected USDC amount after swap
      const expectedUsdcAmount = state.quote.outputTokenAmount;
      console.log('💰 USDC available for minting:', formatUnits(BigInt(expectedUsdcAmount), 6));

      // TODO: Integrate with SyntheticStock contract
      // This is where we would call the mint function on the SyntheticStock contract
      // const mintHash = await walletClient.writeContract({
      //   address: SYNTHETIC_STOCK_ADDRESS,
      //   abi: SYNTHETIC_STOCK_ABI,
      //   functionName: 'mint',
      //   args: [expectedUsdcAmount],
      // });

      // For now, simulate the mint
      console.log('🎭 Simulating AAPL-x mint...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockMintHash = '0x' + Math.random().toString(16).substr(2, 64);

      setState(prev => ({ 
        ...prev, 
        isMinting: false, 
        mintTxHash: mockMintHash 
      }));

      console.log('🎉 Swap and mint completed successfully!');

    } catch (error) {
      console.error('Swap and mint failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setState(prev => ({ 
        ...prev, 
        isSwapping: false, 
        isMinting: false,
        quoteError: errorMessage
      }));
      throw error;
    }
  }, [state, address, walletClient, publicClient, currentChainId]);

  const reset = useCallback(() => {
    setState({
      inputToken: null,
      outputToken: usdcToken,
      inputAmount: '',
      quote: null,
      isLoadingQuote: false,
      quoteError: null,
      isSwapping: false,
      isMinting: false,
      swapTxHash: null,
      mintTxHash: null,
      slippageTolerance: '0.005',
      showAdvanced: false,
    });
  }, [usdcToken]);

  // Auto-refresh quote every 30 seconds when active
  useEffect(() => {
    if (state.quote && state.inputToken && state.inputAmount && !state.isLoadingQuote) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing quote...');
        getQuote();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [state.quote, state.inputToken, state.inputAmount, state.isLoadingQuote, getQuote]);

  // Computed values
  const canGetQuote = Boolean(
    state.inputToken && 
    state.inputAmount && 
    parseFloat(state.inputAmount) > 0 && 
    isConnected &&
    state.inputToken.address !== usdcToken.address // Can't swap USDC to USDC
  );

  const canExecuteSwap = Boolean(
    state.quote && 
    !state.isLoadingQuote && 
    !state.quoteError &&
    !state.isSwapping &&
    !state.isMinting &&
    canGetQuote
  );

  const expectedAaplAmount = state.quote 
    ? calculateExpectedAaplAmount(state.quote.outputTokenAmount)
    : null;

  const priceImpact = state.quote ? parseFloat(state.quote.priceImpact) : null;
  const isHighImpact = priceImpact ? priceImpact > 3 : false; // 3% threshold

  // Validation messages
  const validationError = state.inputToken?.address === usdcToken.address 
    ? 'Cannot swap USDC to USDC' 
    : null;

  return {
    // State
    ...state,
    
    // Computed values
    canGetQuote,
    canExecuteSwap,
    expectedAaplAmount,
    priceImpact,
    isHighImpact,
    validationError,
    currentChainId,
    
    // Actions
    setInputToken,
    setInputAmount,
    setSlippageTolerance,
    setShowAdvanced,
    getQuote,
    refreshQuote,
    executeSwapAndMint,
    reset,
  };
}

// Helper function to calculate expected AAPL amount
function calculateExpectedAaplAmount(usdcAmount: string): string {
  try {
    // Convert USDC amount (6 decimals) to float
    const usdcAmountFloat = parseFloat(formatUnits(BigInt(usdcAmount), 6));
    
    // Mock AAPL price and collateral ratio (this would come from oracle in production)
    const aaplPrice = 150; // $150 per AAPL share
    const collateralRatio = 1.5; // 150% over-collateralization
    
    // Calculate AAPL amount: (USDC / collateralRatio) / aaplPrice
    const aaplAmount = usdcAmountFloat / (collateralRatio * aaplPrice);
    
    return aaplAmount.toFixed(6);
  } catch (error) {
    console.error('Error calculating AAPL amount:', error);
    return '0';
  }
} 