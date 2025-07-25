// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./DEXRouter.sol";
import "./SyntheticStock.sol";
import "./Paymaster.sol";

/**
 * @title SmartAccount
 * @dev EIP-4337 Account Abstraction Smart Account for gasless UX and batch transactions
 * @notice Per SDD Architecture: Frontend --> AA --> Router/Synth (orchestrates the flow)
 */
contract SmartAccount is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant SESSION_KEY_ROLE = keccak256("SESSION_KEY_ROLE");

    // Core contract references
    DEXRouter public immutable dexRouter;
    SyntheticStock public immutable syntheticStock;
    Paymaster public immutable paymaster;

    // Account owner and guardians per SDD FR-5
    address public owner;
    address[] public guardians;
    uint256 public constant GUARDIAN_THRESHOLD = 2; // 2-of-3 guardian scheme per SDD
    
    // Session keys for repeated operations per SDD
    mapping(address => uint256) public sessionKeyExpiry;
    uint256 public constant SESSION_KEY_DURATION = 7 days;

    // Recovery process
    struct Recovery {
        address newOwner;
        uint256 confirmations;
        mapping(address => bool) confirmed;
        uint256 deadline;
    }
    Recovery public activeRecovery;
    uint256 public constant RECOVERY_PERIOD = 3 days;

    // Nonce for replay protection
    uint256 public nonce;

    event BatchExecuted(
        address indexed user,
        bytes[] callData,
        bool[] success,
        bytes[] results
    );
    
    event SwapAndMintExecuted(
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        uint256 aaplMinted,
        uint256 gasUsed
    );
    
    event RedeemAndSwapExecuted(
        address indexed user,
        uint256 aaplRedeemed,
        address tokenOut,
        uint256 amountOut
    );

    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event SessionKeyGranted(address indexed sessionKey, uint256 expiry);
    event RecoveryInitiated(address indexed newOwner, uint256 deadline);
    event RecoveryExecuted(address indexed newOwner);

    constructor(
        address _owner,
        address[] memory _guardians,
        address _dexRouter,
        address _syntheticStock,
        address _paymaster
    ) {
        require(_owner != address(0), "SmartAccount: invalid owner");
        require(_guardians.length == 3, "SmartAccount: need exactly 3 guardians");
        require(_dexRouter != address(0), "SmartAccount: invalid DEX router");
        require(_syntheticStock != address(0), "SmartAccount: invalid SyntheticStock");
        require(_paymaster != address(0), "SmartAccount: invalid Paymaster");
        
        owner = _owner;
        guardians = _guardians;
        dexRouter = DEXRouter(_dexRouter);
        syntheticStock = SyntheticStock(_syntheticStock);
        paymaster = Paymaster(_paymaster);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        
        // Grant guardian roles
        for (uint i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "SmartAccount: invalid guardian");
            _grantRole(GUARDIAN_ROLE, _guardians[i]);
        }
    }

    modifier onlyOwnerOrSession() {
        require(
            msg.sender == owner || 
            (hasRole(SESSION_KEY_ROLE, msg.sender) && sessionKeyExpiry[msg.sender] > block.timestamp),
            "SmartAccount: unauthorized"
        );
        _;
    }

    /**
     * @dev EIP-4337 validateUserOp function
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation
     * @param missingAccountFunds Missing account funds that need to be deposited
     * @return validationData Packed validation data (sigFailure, validUntil, validAfter)
     */
    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        // Extract signature from userOp (simplified)
        bytes memory signature = userOp[userOp.length - 65:];
        
        // Verify signature against owner or session key
        address signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(userOpHash), signature);
        bool validSigner = (signer == owner) || 
                          (hasRole(SESSION_KEY_ROLE, signer) && sessionKeyExpiry[signer] > block.timestamp);
        
        if (!validSigner) {
            return 1; // SIG_VALIDATION_FAILED
        }
        
        // Pay for gas if needed
        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "SmartAccount: failed to pay gas");
        }
        
        return 0; // SIG_VALIDATION_PASSED
    }

    /**
     * @dev Execute batch transaction: swap token → USDC → mint AAPL-x (per SDD flow)
     * @param tokenIn Input token address
     * @param amountIn Amount of input tokens
     * @param minUsdcOut Minimum USDC from swap
     * @param minAaplOut Minimum AAPL-x to mint
     * @param swapData Encoded swap data from OKX DEX API
     * @return usdcReceived Amount of USDC received from swap
     * @return aaplMinted Amount of AAPL-x tokens minted
     */
    function swapAndMint(
        address tokenIn,
        uint256 amountIn,
        uint256 minUsdcOut,
        uint256 minAaplOut,
        bytes calldata swapData
    ) external onlyOwnerOrSession nonReentrant whenNotPaused returns (uint256 usdcReceived, uint256 aaplMinted) {
        uint256 gasStart = gasleft();
        
        // Step 1: Transfer tokens to this contract
        IERC20(tokenIn).safeTransferFrom(owner, address(this), amountIn);
        
        // Step 2: Approve DEX router to spend tokens
        IERC20(tokenIn).approve(address(dexRouter), amountIn);
        
        // Step 3: AA --> Router --> Vault (swap and deposit to vault)
        usdcReceived = dexRouter.swapToUSDCAndDeposit(
            tokenIn,
            amountIn,
            minUsdcOut,
            swapData,
            owner
        );
        
        // Step 4: Calculate max AAPL that can be minted with available collateral
        uint256 maxAaplAmount = calculateMaxMintAmount(owner);
        uint256 aaplToMint = minAaplOut <= maxAaplAmount ? minAaplOut : maxAaplAmount;
        
        require(aaplToMint > 0, "SmartAccount: insufficient collateral for minting");
        
        // Step 5: AA --> Synth (mint AAPL-x using vault collateral)
        syntheticStock.mint(owner, aaplToMint);
        aaplMinted = aaplToMint;
        
        uint256 gasUsed = gasStart - gasleft();
        emit SwapAndMintExecuted(owner, tokenIn, amountIn, aaplMinted, gasUsed);
        
        return (usdcReceived, aaplMinted);
    }

    /**
     * @dev Execute batch transaction: redeem AAPL-x → USDC → swap to token (per SDD flow)
     * @param aaplAmount Amount of AAPL-x to redeem
     * @param tokenOut Output token address
     * @param minTokenOut Minimum output tokens
     * @param swapData Encoded swap data from OKX DEX API
     * @return usdcRedeemed Amount of USDC redeemed
     * @return tokenReceived Amount of output tokens received
     */
    function redeemAndSwap(
        uint256 aaplAmount,
        address tokenOut,
        uint256 minTokenOut,
        bytes calldata swapData
    ) external onlyOwnerOrSession nonReentrant whenNotPaused returns (uint256 usdcRedeemed, uint256 tokenReceived) {
        // Step 1: AA --> Synth (redeem AAPL-x to vault)
        usdcRedeemed = syntheticStock.redeem(owner, aaplAmount);
        
        // Step 2: Withdraw USDC from vault to this contract for swapping
        // (Note: This would need vault permission for the AA contract)
        
        // Step 3: AA --> Router (swap USDC to desired token)
        if (tokenOut != address(dexRouter.usdcToken())) {
            // Approve router to spend USDC
            IERC20(dexRouter.usdcToken()).approve(address(dexRouter), usdcRedeemed);
            
            tokenReceived = dexRouter.swapUSDCToToken(
                tokenOut,
                usdcRedeemed,
                minTokenOut,
                swapData,
                owner
            );
        } else {
            // If output is USDC, transfer directly to owner
            IERC20(dexRouter.usdcToken()).safeTransfer(owner, usdcRedeemed);
            tokenReceived = usdcRedeemed;
        }
        
        emit RedeemAndSwapExecuted(owner, aaplAmount, tokenOut, tokenReceived);
        
        return (usdcRedeemed, tokenReceived);
    }

    /**
     * @dev Execute arbitrary batch transaction
     * @param targets Array of target contract addresses
     * @param values Array of ETH values to send
     * @param callData Array of call data
     * @return success Array of success flags
     * @return results Array of return data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata callData
    ) external onlyOwnerOrSession nonReentrant whenNotPaused returns (bool[] memory success, bytes[] memory results) {
        require(targets.length == values.length && values.length == callData.length, "SmartAccount: length mismatch");
        
        success = new bool[](targets.length);
        results = new bytes[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            (success[i], results[i]) = targets[i].call{value: values[i]}(callData[i]);
        }
        
        emit BatchExecuted(owner, callData, success, results);
        
        return (success, results);
    }

    /**
     * @dev Calculate maximum AAPL amount that can be minted with user's collateral
     * @param user Address of the user
     * @return maxAmount Maximum AAPL amount mintable
     */
    function calculateMaxMintAmount(address user) public view returns (uint256 maxAmount) {
        // Get user's available collateral from vault
        uint256 userCollateral = syntheticStock.collateralVault().getUserCollateral(user);
        if (userCollateral == 0) return 0;
        
        // Get current AAPL price
        (int256 price, , ) = syntheticStock.oracle().getPriceUnsafe();
        if (price <= 0) return 0;
        
        uint256 aaplPrice = uint256(price);
        
        // Calculate max AAPL: collateral * 100 / (price * 150%)
        maxAmount = (userCollateral * 100 * 10**(18 + 8 - 6)) / (aaplPrice * 150);
        
        return maxAmount;
    }

    /**
     * @dev Grant session key for repeated operations per SDD
     * @param sessionKey Address to grant session key
     */
    function grantSessionKey(address sessionKey) external {
        require(msg.sender == owner, "SmartAccount: only owner");
        require(sessionKey != address(0), "SmartAccount: invalid session key");
        
        sessionKeyExpiry[sessionKey] = block.timestamp + SESSION_KEY_DURATION;
        _grantRole(SESSION_KEY_ROLE, sessionKey);
        
        emit SessionKeyGranted(sessionKey, sessionKeyExpiry[sessionKey]);
    }

    /**
     * @dev Revoke session key
     * @param sessionKey Address to revoke
     */
    function revokeSessionKey(address sessionKey) external {
        require(msg.sender == owner, "SmartAccount: only owner");
        
        sessionKeyExpiry[sessionKey] = 0;
        _revokeRole(SESSION_KEY_ROLE, sessionKey);
    }

    /**
     * @dev Initiate social recovery (2-of-3 guardians per SDD FR-5)
     * @param newOwner Address of the new owner
     */
    function initiateRecovery(address newOwner) external onlyRole(GUARDIAN_ROLE) {
        require(newOwner != address(0), "SmartAccount: invalid new owner");
        require(activeRecovery.deadline == 0, "SmartAccount: recovery already active");
        
        activeRecovery.newOwner = newOwner;
        activeRecovery.confirmations = 1;
        activeRecovery.confirmed[msg.sender] = true;
        activeRecovery.deadline = block.timestamp + RECOVERY_PERIOD;
        
        emit RecoveryInitiated(newOwner, activeRecovery.deadline);
    }

    /**
     * @dev Confirm social recovery
     */
    function confirmRecovery() external onlyRole(GUARDIAN_ROLE) {
        require(activeRecovery.deadline > 0, "SmartAccount: no active recovery");
        require(block.timestamp < activeRecovery.deadline, "SmartAccount: recovery expired");
        require(!activeRecovery.confirmed[msg.sender], "SmartAccount: already confirmed");
        
        activeRecovery.confirmed[msg.sender] = true;
        activeRecovery.confirmations++;
        
        // Execute recovery if threshold reached
        if (activeRecovery.confirmations >= GUARDIAN_THRESHOLD) {
            address oldOwner = owner;
            owner = activeRecovery.newOwner;
            
            _revokeRole(DEFAULT_ADMIN_ROLE, oldOwner);
            _grantRole(DEFAULT_ADMIN_ROLE, activeRecovery.newOwner);
            
            // Clear active recovery
            delete activeRecovery;
            
            emit RecoveryExecuted(owner);
            emit OwnerChanged(oldOwner, owner);
        }
    }

    /**
     * @dev Cancel active recovery (owner only)
     */
    function cancelRecovery() external {
        require(msg.sender == owner, "SmartAccount: only owner");
        require(activeRecovery.deadline > 0, "SmartAccount: no active recovery");
        
        delete activeRecovery;
    }

    /**
     * @dev Emergency pause (owner or guardians)
     */
    function pause() external {
        require(msg.sender == owner || hasRole(GUARDIAN_ROLE, msg.sender), "SmartAccount: unauthorized");
        _pause();
    }

    /**
     * @dev Unpause (owner only)
     */
    function unpause() external {
        require(msg.sender == owner, "SmartAccount: only owner");
        _unpause();
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 