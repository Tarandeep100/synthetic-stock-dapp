// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Paymaster
 * @dev EIP-4337 Paymaster for gasless UX in synthetic stock dApp
 * @notice Per SDD FR-4: Paymaster covers gas; accepts USDC/OKB as payment
 */
contract Paymaster is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Supported tokens for gas payment
    IERC20 public immutable usdcToken;
    IERC20 public immutable okbToken;
    
    // Gas pricing (wei per token unit)
    uint256 public usdcToGasRate = 1000; // 1000 wei per USDC unit (6 decimals)
    uint256 public okbToGasRate = 500;   // 500 wei per OKB unit
    
    // Rate limiting per user
    mapping(address => uint256) public userGasUsed;
    mapping(address => uint256) public lastResetTime;
    uint256 public constant RATE_LIMIT_PERIOD = 1 hours;
    uint256 public constant MAX_GAS_PER_HOUR = 0.01 ether; // Max gas subsidy per user per hour
    
    // Treasury for gas reserves
    uint256 public gasReserve;
    uint256 public minimumGasReserve = 0.1 ether;

    event GasPaid(
        address indexed user,
        address indexed token,
        uint256 tokenAmount,
        uint256 gasAmount,
        bytes32 userOpHash
    );
    
    event GasDeposited(address indexed depositor, uint256 amount);
    event RatesUpdated(uint256 newUsdcRate, uint256 newOkbRate);

    constructor(
        address _usdcToken,
        address _okbToken,
        address admin
    ) {
        require(_usdcToken != address(0), "Paymaster: USDC cannot be zero address");
        require(_okbToken != address(0), "Paymaster: OKB cannot be zero address");
        require(admin != address(0), "Paymaster: admin cannot be zero address");
        
        usdcToken = IERC20(_usdcToken);
        okbToken = IERC20(_okbToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Validate UserOperation for gas sponsorship per EIP-4337
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation
     * @param maxCost Maximum cost of the operation
     * @return context Context data for post-operation processing
     * @return validationData Validation result (0 = valid)
     */
    function validatePaymasterUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view returns (bytes memory context, uint256 validationData) {
        // For MVP, approve all operations from whitelisted contracts
        // In production, would validate calldata for swap+mint operations
        
        // Extract sender address from userOp (simplified)
        address sender = address(bytes20(userOp[4:24]));
        
        // Check rate limits
        if (_isRateLimited(sender, maxCost)) {
            return ("", 1); // Validation failed
        }
        
        // Check if we have sufficient gas reserves
        if (gasReserve < maxCost + minimumGasReserve) {
            return ("", 1); // Validation failed
        }
        
        // Return success with context data
        context = abi.encode(sender, maxCost, userOpHash);
        validationData = 0; // Success
    }

    /**
     * @dev Post-operation processing to charge user for gas
     * @param context Context data from validation
     * @param actualGasCost Actual gas cost incurred
     */
    function postOp(
        bytes calldata context,
        uint256 actualGasCost
    ) external nonReentrant whenNotPaused {
        (address sender, uint256 maxCost, bytes32 userOpHash) = abi.decode(
            context, 
            (address, uint256, bytes32)
        );
        
        // Update user's gas usage for rate limiting
        _updateGasUsage(sender, actualGasCost);
        
        // Try to charge user in USDC, fallback to OKB
        bool charged = _chargeInUSDC(sender, actualGasCost, userOpHash);
        if (!charged) {
            _chargeInOKB(sender, actualGasCost, userOpHash);
        }
        
        // Update gas reserve
        gasReserve -= actualGasCost;
    }

    /**
     * @dev Charge user for gas in USDC
     */
    function _chargeInUSDC(
        address user, 
        uint256 gasAmount, 
        bytes32 userOpHash
    ) private returns (bool) {
        uint256 usdcAmount = (gasAmount * usdcToGasRate) / 1e18;
        
        if (usdcToken.balanceOf(user) >= usdcAmount) {
            usdcToken.safeTransferFrom(user, address(this), usdcAmount);
            emit GasPaid(user, address(usdcToken), usdcAmount, gasAmount, userOpHash);
            return true;
        }
        return false;
    }

    /**
     * @dev Charge user for gas in OKB
     */
    function _chargeInOKB(
        address user, 
        uint256 gasAmount, 
        bytes32 userOpHash
    ) private {
        uint256 okbAmount = (gasAmount * okbToGasRate) / 1e18;
        
        require(
            okbToken.balanceOf(user) >= okbAmount, 
            "Paymaster: insufficient balance for gas payment"
        );
        
        okbToken.safeTransferFrom(user, address(this), okbAmount);
        emit GasPaid(user, address(okbToken), okbAmount, gasAmount, userOpHash);
    }

    /**
     * @dev Check if user is rate limited
     */
    function _isRateLimited(address user, uint256 gasCost) private view returns (bool) {
        uint256 currentPeriod = block.timestamp / RATE_LIMIT_PERIOD;
        uint256 userLastPeriod = lastResetTime[user] / RATE_LIMIT_PERIOD;
        
        if (currentPeriod > userLastPeriod) {
            return false; // New period, reset limit
        }
        
        return userGasUsed[user] + gasCost > MAX_GAS_PER_HOUR;
    }

    /**
     * @dev Update user's gas usage for current period
     */
    function _updateGasUsage(address user, uint256 gasCost) private {
        uint256 currentPeriod = block.timestamp / RATE_LIMIT_PERIOD;
        uint256 userLastPeriod = lastResetTime[user] / RATE_LIMIT_PERIOD;
        
        if (currentPeriod > userLastPeriod) {
            userGasUsed[user] = gasCost;
            lastResetTime[user] = block.timestamp;
        } else {
            userGasUsed[user] += gasCost;
        }
    }

    /**
     * @dev Deposit ETH for gas reserves (admin only)
     */
    function depositGas() external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        gasReserve += msg.value;
        emit GasDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Update gas conversion rates (admin only)
     */
    function updateRates(
        uint256 newUsdcRate, 
        uint256 newOkbRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newUsdcRate > 0, "Paymaster: USDC rate must be positive");
        require(newOkbRate > 0, "Paymaster: OKB rate must be positive");
        
        usdcToGasRate = newUsdcRate;
        okbToGasRate = newOkbRate;
        
        emit RatesUpdated(newUsdcRate, newOkbRate);
    }

    /**
     * @dev Emergency withdrawal of gas reserves (admin only)
     */
    function emergencyWithdrawGas(
        address recipient, 
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Paymaster: invalid recipient");
        require(amount <= gasReserve, "Paymaster: insufficient gas reserve");
        
        gasReserve -= amount;
        payable(recipient).transfer(amount);
    }

    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get current gas reserve
     */
    function getGasReserve() external view returns (uint256) {
        return gasReserve;
    }

    /**
     * @dev Check if user can afford gas for operation
     */
    function canPayForGas(address user, uint256 gasCost) external view returns (bool) {
        if (_isRateLimited(user, gasCost)) {
            return false;
        }
        
        uint256 usdcAmount = (gasCost * usdcToGasRate) / 1e18;
        uint256 okbAmount = (gasCost * okbToGasRate) / 1e18;
        
        return usdcToken.balanceOf(user) >= usdcAmount || 
               okbToken.balanceOf(user) >= okbAmount;
    }
} 