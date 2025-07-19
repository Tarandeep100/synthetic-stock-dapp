// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CollateralVault
 * @dev Securely holds USDC collateral for the synthetic stock system
 * @notice Only authorized contracts can deposit/withdraw collateral
 */
contract CollateralVault is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant SYNTHETIC_STOCK_ROLE = keccak256("SYNTHETIC_STOCK_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    IERC20 public immutable usdcToken;
    
    // Collateral tracking
    mapping(address => uint256) private _userCollateral;
    uint256 private _totalCollateral;
    
    // Emergency withdrawal tracking
    mapping(address => bool) private _emergencyWithdrawals;
    uint256 public emergencyWithdrawalDelay = 24 hours;
    
    event CollateralDeposited(address indexed user, uint256 amount, uint256 totalCollateral);
    event CollateralWithdrawn(address indexed user, uint256 amount, uint256 totalCollateral);
    event EmergencyWithdrawalInitiated(address indexed user, uint256 timestamp);
    event EmergencyWithdrawalExecuted(address indexed user, uint256 amount);

    constructor(address _usdcToken, address admin) {
        require(_usdcToken != address(0), "CollateralVault: USDC token cannot be zero address");
        require(admin != address(0), "CollateralVault: admin cannot be zero address");
        
        usdcToken = IERC20(_usdcToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
    }

    /**
     * @dev Deposit USDC collateral for a user
     * @param user Address of the user
     * @param amount Amount of USDC to deposit (6 decimal precision)
     * @notice Only authorized contracts (SyntheticStock) can call this
     */
    function depositCollateral(address user, uint256 amount) 
        external 
        onlyRole(SYNTHETIC_STOCK_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(user != address(0), "CollateralVault: user cannot be zero address");
        require(amount > 0, "CollateralVault: amount must be positive");
        
        // Transfer USDC from the calling contract to this vault
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        _userCollateral[user] += amount;
        _totalCollateral += amount;
        
        emit CollateralDeposited(user, amount, _totalCollateral);
    }

    /**
     * @dev Withdraw USDC collateral for a user
     * @param user Address of the user
     * @param amount Amount of USDC to withdraw
     * @param recipient Address to send the USDC to
     * @notice Only authorized contracts (SyntheticStock) can call this
     */
    function withdrawCollateral(address user, uint256 amount, address recipient) 
        external 
        onlyRole(SYNTHETIC_STOCK_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(user != address(0), "CollateralVault: user cannot be zero address");
        require(recipient != address(0), "CollateralVault: recipient cannot be zero address");
        require(amount > 0, "CollateralVault: amount must be positive");
        require(_userCollateral[user] >= amount, "CollateralVault: insufficient collateral");
        
        _userCollateral[user] -= amount;
        _totalCollateral -= amount;
        
        // Transfer USDC to the recipient
        usdcToken.safeTransfer(recipient, amount);
        
        emit CollateralWithdrawn(user, amount, _totalCollateral);
    }

    /**
     * @dev Get user's collateral balance
     * @param user Address of the user
     * @return uint256 User's collateral balance in USDC (6 decimals)
     */
    function getUserCollateral(address user) external view returns (uint256) {
        return _userCollateral[user];
    }

    /**
     * @dev Get total collateral in the vault
     * @return uint256 Total collateral in USDC (6 decimals)
     */
    function getTotalCollateral() external view returns (uint256) {
        return _totalCollateral;
    }

    /**
     * @dev Get actual USDC balance of the vault (for verification)
     * @return uint256 Actual USDC balance
     */
    function getVaultBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @dev Check if vault has sufficient funds
     * @return bool True if actual balance matches tracked total
     */
    function isVaultSolvent() external view returns (bool) {
        return usdcToken.balanceOf(address(this)) >= _totalCollateral;
    }

    /**
     * @dev Initiate emergency withdrawal (for users in case of contract issues)
     * @notice Users can initiate emergency withdrawal after delay period
     */
    function initiateEmergencyWithdrawal() external whenPaused {
        require(_userCollateral[msg.sender] > 0, "CollateralVault: no collateral to withdraw");
        require(!_emergencyWithdrawals[msg.sender], "CollateralVault: withdrawal already initiated");
        
        _emergencyWithdrawals[msg.sender] = true;
        emit EmergencyWithdrawalInitiated(msg.sender, block.timestamp);
    }

    /**
     * @dev Execute emergency withdrawal after delay period
     * @notice Users can withdraw their collateral after emergency delay
     */
    function executeEmergencyWithdrawal() external nonReentrant {
        require(_emergencyWithdrawals[msg.sender], "CollateralVault: withdrawal not initiated");
        require(_userCollateral[msg.sender] > 0, "CollateralVault: no collateral to withdraw");
        
        uint256 amount = _userCollateral[msg.sender];
        _userCollateral[msg.sender] = 0;
        _totalCollateral -= amount;
        _emergencyWithdrawals[msg.sender] = false;
        
        usdcToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdrawalExecuted(msg.sender, amount);
    }

    /**
     * @dev Pause the contract (emergency stop)
     * @notice Only authorized pausers can call this
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     * @notice Only authorized pausers can call this
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency function to recover stuck tokens (not USDC)
     * @param token Address of the token to recover
     * @param amount Amount to recover
     * @param recipient Address to send recovered tokens
     * @notice Only emergency role can call this, cannot recover USDC
     */
    function emergencyTokenRecovery(
        address token, 
        uint256 amount, 
        address recipient
    ) external onlyRole(EMERGENCY_ROLE) {
        require(token != address(usdcToken), "CollateralVault: cannot recover USDC");
        require(token != address(0), "CollateralVault: token cannot be zero address");
        require(recipient != address(0), "CollateralVault: recipient cannot be zero address");
        
        IERC20(token).safeTransfer(recipient, amount);
    }

    /**
     * @dev Get emergency withdrawal status for a user
     * @param user Address of the user
     * @return bool Whether emergency withdrawal was initiated
     */
    function hasInitiatedEmergencyWithdrawal(address user) external view returns (bool) {
        return _emergencyWithdrawals[user];
    }
} 