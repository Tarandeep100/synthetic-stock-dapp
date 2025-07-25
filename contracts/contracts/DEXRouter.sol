// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CollateralVault.sol";

/**
 * @title DEXRouter
 * @dev Handles token swaps via OKX DEX and deposits USDC to CollateralVault
 * @notice Per SDD Architecture: AA --> Router --> Vault (Router only swaps, AA orchestrates)
 */
contract DEXRouter is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant AA_ROLE = keccak256("AA_ROLE"); // Only AA can call router

    // Core contract references
    CollateralVault public immutable collateralVault;
    IERC20 public immutable usdcToken;
    
    // Slippage protection
    uint256 public constant MAX_SLIPPAGE = 500; // 5% max slippage
    uint256 public defaultSlippage = 100; // 1% default slippage
    
    // Fee parameters
    uint256 public routerFee = 10; // 0.1% router fee (basis points)
    uint256 public constant MAX_ROUTER_FEE = 100; // 1% max router fee

    // OKX DEX integration parameters
    address public okxDEXAggregator; // OKX DEX aggregator contract address
    mapping(address => bool) public allowedTokens; // Whitelist of supported tokens

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    
    event SwapToUSDCAndDeposit(
        address indexed user,
        address indexed tokenIn,
        uint256 tokenAmountIn,
        uint256 usdcReceived,
        uint256 routerFee
    );

    event TokenWhitelisted(address indexed token, bool allowed);
    event OKXAggregatorUpdated(address indexed newAggregator);

    constructor(
        address _collateralVault,
        address _usdcToken,
        address _okxDEXAggregator,
        address admin
    ) {
        require(_collateralVault != address(0), "DEXRouter: CollateralVault cannot be zero address");
        require(_usdcToken != address(0), "DEXRouter: USDC cannot be zero address");
        require(_okxDEXAggregator != address(0), "DEXRouter: OKX aggregator cannot be zero address");
        require(admin != address(0), "DEXRouter: admin cannot be zero address");
        
        collateralVault = CollateralVault(_collateralVault);
        usdcToken = IERC20(_usdcToken);
        okxDEXAggregator = _okxDEXAggregator;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        // Whitelist USDC by default
        allowedTokens[_usdcToken] = true;
    }

    /**
     * @dev Execute token swap using OKX DEX (for any token pair)
     * @param tokenIn Input token address
     * @param tokenOut Output token address  
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum output tokens (slippage protection)
     * @param swapData Encoded swap data from OKX DEX API
     * @param recipient Address to receive output tokens
     * @return amountOut Actual amount of output tokens received
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata swapData,
        address recipient
    ) external onlyRole(AA_ROLE) nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(allowedTokens[tokenIn], "DEXRouter: input token not allowed");
        require(allowedTokens[tokenOut], "DEXRouter: output token not allowed");
        require(amountIn > 0, "DEXRouter: amount must be positive");
        require(recipient != address(0), "DEXRouter: invalid recipient");
        
        IERC20 inputToken = IERC20(tokenIn);
        IERC20 outputToken = IERC20(tokenOut);
        
        // Transfer input tokens from caller (should be AA wallet)
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Calculate router fee
        uint256 fee = (amountIn * routerFee) / 10000;
        uint256 netAmountIn = amountIn - fee;
        
        // Approve tokens for OKX aggregator
        inputToken.approve(okxDEXAggregator, netAmountIn);
        
        // Record balance before swap
        uint256 outputBalanceBefore = outputToken.balanceOf(address(this));
        
        // Execute swap via OKX DEX aggregator
        (bool success, ) = okxDEXAggregator.call(swapData);
        require(success, "DEXRouter: swap failed");
        
        // Calculate actual output amount
        uint256 outputBalanceAfter = outputToken.balanceOf(address(this));
        amountOut = outputBalanceAfter - outputBalanceBefore;
        
        // Slippage protection
        require(amountOut >= minAmountOut, "DEXRouter: insufficient output amount");
        
        // Transfer output tokens to recipient
        outputToken.safeTransfer(recipient, amountOut);
        
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
        
        return amountOut;
    }

    /**
     * @dev Swap any token to USDC and deposit to CollateralVault (per SDD Architecture)
     * @param tokenIn Input token address
     * @param amountIn Amount of input tokens
     * @param minUsdcOut Minimum USDC from swap (slippage protection)
     * @param swapData Encoded swap data from OKX DEX API
     * @param user User address for vault deposit
     * @return usdcReceived Amount of USDC received and deposited to vault
     * @notice Per Architecture: AA --> Router --> Vault
     */
    function swapToUSDCAndDeposit(
        address tokenIn,
        uint256 amountIn,
        uint256 minUsdcOut,
        bytes calldata swapData,
        address user
    ) external onlyRole(AA_ROLE) nonReentrant whenNotPaused returns (uint256 usdcReceived) {
        require(allowedTokens[tokenIn], "DEXRouter: input token not allowed");
        require(amountIn > 0, "DEXRouter: amount must be positive");
        require(user != address(0), "DEXRouter: invalid user");
        require(tokenIn != address(usdcToken), "DEXRouter: use depositUSDC for USDC");
        
        IERC20 inputToken = IERC20(tokenIn);
        
        // Transfer input tokens from caller (AA wallet)
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Calculate router fee
        uint256 fee = (amountIn * routerFee) / 10000;
        uint256 netAmountIn = amountIn - fee;
        
        // Approve tokens for OKX aggregator
        inputToken.approve(okxDEXAggregator, netAmountIn);
        
        // Record USDC balance before swap
        uint256 usdcBalanceBefore = usdcToken.balanceOf(address(this));
        
        // Execute swap to USDC via OKX DEX
        (bool success, ) = okxDEXAggregator.call(swapData);
        require(success, "DEXRouter: swap failed");
        
        // Calculate USDC received
        uint256 usdcBalanceAfter = usdcToken.balanceOf(address(this));
        usdcReceived = usdcBalanceAfter - usdcBalanceBefore;
        
        // Slippage protection
        require(usdcReceived >= minUsdcOut, "DEXRouter: insufficient USDC received");
        
        // Approve and deposit USDC to CollateralVault for the user
        usdcToken.approve(address(collateralVault), usdcReceived);
        collateralVault.depositCollateral(user, usdcReceived);
        
        emit SwapToUSDCAndDeposit(
            user, 
            tokenIn, 
            amountIn, 
            usdcReceived, 
            fee
        );
        
        return usdcReceived;
    }

    /**
     * @dev Deposit USDC directly to CollateralVault (when user already has USDC)
     * @param user User address for vault deposit
     * @param usdcAmount Amount of USDC to deposit
     * @notice Per Architecture: AA --> Router --> Vault
     */
    function depositUSDC(
        address user,
        uint256 usdcAmount
    ) external onlyRole(AA_ROLE) nonReentrant whenNotPaused {
        require(user != address(0), "DEXRouter: invalid user");
        require(usdcAmount > 0, "DEXRouter: amount must be positive");
        
        // Transfer USDC from caller (AA wallet)
        usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);
        
        // Calculate router fee
        uint256 fee = (usdcAmount * routerFee) / 10000;
        uint256 netAmount = usdcAmount - fee;
        
        // Approve and deposit USDC to CollateralVault for the user
        usdcToken.approve(address(collateralVault), netAmount);
        collateralVault.depositCollateral(user, netAmount);
        
        emit SwapToUSDCAndDeposit(user, address(usdcToken), usdcAmount, netAmount, fee);
    }

    /**
     * @dev Swap USDC to desired token and transfer to user (for redeem-and-swap flow)
     * @param tokenOut Output token address
     * @param usdcAmount Amount of USDC to swap
     * @param minTokenOut Minimum output tokens (slippage protection)
     * @param swapData Encoded swap data from OKX DEX API
     * @param recipient Address to receive output tokens
     * @return tokenAmountOut Amount of output tokens received
     */
    function swapUSDCToToken(
        address tokenOut,
        uint256 usdcAmount,
        uint256 minTokenOut,
        bytes calldata swapData,
        address recipient
    ) external onlyRole(AA_ROLE) nonReentrant whenNotPaused returns (uint256 tokenAmountOut) {
        require(allowedTokens[tokenOut], "DEXRouter: output token not allowed");
        require(usdcAmount > 0, "DEXRouter: amount must be positive");
        require(recipient != address(0), "DEXRouter: invalid recipient");
        
        // If output is USDC, no swap needed
        if (tokenOut == address(usdcToken)) {
            usdcToken.safeTransferFrom(msg.sender, recipient, usdcAmount);
            return usdcAmount;
        }
        
        IERC20 outputToken = IERC20(tokenOut);
        
        // Transfer USDC from caller (AA wallet)
        usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);
        
        // Approve USDC for OKX aggregator
        usdcToken.approve(okxDEXAggregator, usdcAmount);
        
        // Record output token balance before swap
        uint256 outputBalanceBefore = outputToken.balanceOf(address(this));
        
        // Execute swap from USDC to desired token
        (bool success, ) = okxDEXAggregator.call(swapData);
        require(success, "DEXRouter: swap failed");
        
        // Calculate actual output amount
        uint256 outputBalanceAfter = outputToken.balanceOf(address(this));
        tokenAmountOut = outputBalanceAfter - outputBalanceBefore;
        
        // Slippage protection
        require(tokenAmountOut >= minTokenOut, "DEXRouter: insufficient output amount");
        
        // Transfer output tokens to recipient
        outputToken.safeTransfer(recipient, tokenAmountOut);
        
        emit SwapExecuted(msg.sender, address(usdcToken), tokenOut, usdcAmount, tokenAmountOut, 0);
        
        return tokenAmountOut;
    }

    /**
     * @dev Whitelist/blacklist tokens for swapping (admin only)
     */
    function setTokenAllowance(address token, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "DEXRouter: invalid token address");
        allowedTokens[token] = allowed;
        emit TokenWhitelisted(token, allowed);
    }

    /**
     * @dev Add AA wallet address (admin only)
     */
    function addAAWallet(address aaWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(aaWallet != address(0), "DEXRouter: invalid AA wallet");
        _grantRole(AA_ROLE, aaWallet);
    }

    /**
     * @dev Remove AA wallet address (admin only)
     */
    function removeAAWallet(address aaWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(AA_ROLE, aaWallet);
    }

    /**
     * @dev Update OKX DEX aggregator address (admin only)
     */
    function updateOKXAggregator(address newAggregator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAggregator != address(0), "DEXRouter: invalid aggregator address");
        okxDEXAggregator = newAggregator;
        emit OKXAggregatorUpdated(newAggregator);
    }

    /**
     * @dev Update router fee (admin only)
     */
    function updateRouterFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee <= MAX_ROUTER_FEE, "DEXRouter: fee too high");
        routerFee = newFee;
    }

    /**
     * @dev Update default slippage tolerance (admin only)
     */
    function updateDefaultSlippage(uint256 newSlippage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newSlippage <= MAX_SLIPPAGE, "DEXRouter: slippage too high");
        defaultSlippage = newSlippage;
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Withdraw collected fees (admin only)
     */
    function withdrawFees(address token, address recipient, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(recipient != address(0), "DEXRouter: invalid recipient");
        IERC20(token).safeTransfer(recipient, amount);
    }

    /**
     * @dev Emergency token recovery (admin only)
     */
    function emergencyTokenRecovery(
        address token,
        address recipient,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "DEXRouter: invalid recipient");
        IERC20(token).safeTransfer(recipient, amount);
    }
} 