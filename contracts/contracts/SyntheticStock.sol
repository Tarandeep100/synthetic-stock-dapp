// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "./AAPLToken.sol";
import "./CollateralVault.sol";
import "./OracleAdapter.sol";

/**
 * @title SyntheticStock
 * @dev Main contract for minting and redeeming synthetic AAPL shares
 * @notice Per SDD Architecture: AA --> Synth (reads collateral from Vault)
 */
contract SyntheticStock is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant AA_ROLE = keccak256("AA_ROLE"); // Only AA can call mint/redeem

    // Core contracts
    AAPLToken public aaplToken;
    CollateralVault public collateralVault;
    OracleAdapter public oracle;
    IERC20 public usdcToken;

    // Collateralization parameters (per SDD section 5)
    uint256 public constant COLLATERAL_RATIO = 150; // 150% as per SDD
    uint256 public constant LIQUIDATION_THRESHOLD = 120; // 120%
    uint256 public constant LIQUIDATION_PENALTY = 10; // 10%

    // Scaling factors for decimal conversion
    uint256 public constant USDC_DECIMALS = 6;
    uint256 public constant AAPL_DECIMALS = 18;
    uint256 public constant PRICE_DECIMALS = 8; // Oracle price precision (1e8)

    // Fee parameters (in basis points)
    uint256 public mintFee = 25; // 0.25% per SDD
    uint256 public redeemFee = 25; // 0.25%
    uint256 public constant MAX_FEE = 1000; // 10% max fee

    // User position tracking
    mapping(address => uint256) public userAaplBalance; // Track user's AAPL-x minted

    // Events per SDD section 6.1
    event Minted(
        address indexed user,
        uint256 collateralUsed,
        uint256 aaplMinted,
        uint256 aaplPrice,
        uint256 fee
    );
    
    event Redeemed(
        address indexed user,
        uint256 aaplBurned,
        uint256 collateralReturned,
        uint256 aaplPrice,
        uint256 fee
    );
    
    event Liquidated(
        address indexed user,
        address indexed liquidator,
        uint256 aaplBurned,
        uint256 collateralSeized,
        uint256 penalty
    );

    event FeesUpdated(uint256 newMintFee, uint256 newRedeemFee);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with required addresses per SDD architecture
     */
    function initialize(
        address _aaplToken,
        address _collateralVault,
        address _oracle,
        address _usdcToken,
        address admin
    ) external initializer {
        require(_aaplToken != address(0), "SyntheticStock: AAPL token cannot be zero");
        require(_collateralVault != address(0), "SyntheticStock: vault cannot be zero");
        require(_oracle != address(0), "SyntheticStock: oracle cannot be zero");
        require(_usdcToken != address(0), "SyntheticStock: USDC cannot be zero");
        require(admin != address(0), "SyntheticStock: admin cannot be zero");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        aaplToken = AAPLToken(_aaplToken);
        collateralVault = CollateralVault(_collateralVault);
        oracle = OracleAdapter(_oracle);
        usdcToken = IERC20(_usdcToken);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    /**
     * @dev Mint AAPL-x tokens using collateral already in vault
     * @param user Address of the user to mint for
     * @param aaplAmount Amount of AAPL-x tokens to mint (18 decimals)
     * @return collateralUsed Amount of USDC collateral consumed from vault
     * @notice Per SDD Architecture: AA --> Synth (vault collateral already deposited by Router)
     */
    function mint(address user, uint256 aaplAmount) external onlyRole(AA_ROLE) nonReentrant whenNotPaused returns (uint256 collateralUsed) {
        require(user != address(0), "SyntheticStock: invalid user");
        require(aaplAmount > 0, "SyntheticStock: amount must be positive");
        
        // Get current AAPL price from oracle (per SDD section 6.2)
        (int256 price, ) = oracle.getPrice();
        require(price > 0, "SyntheticStock: invalid price");
        
        uint256 aaplPrice = uint256(price); // Price in 1e8 format
        
        // Calculate required USDC collateral for 150% collateralization
        // Formula: Required USDC = (AAPL amount * price * 150%) / 100
        collateralUsed = (aaplAmount * aaplPrice * COLLATERAL_RATIO) / 
                        (100 * 10**(AAPL_DECIMALS + PRICE_DECIMALS - USDC_DECIMALS));
        
        require(collateralUsed > 0, "SyntheticStock: insufficient mint amount");
        
        // Check if user has enough collateral in vault
        uint256 userCollateral = collateralVault.getUserCollateral(user);
        require(userCollateral >= collateralUsed, "SyntheticStock: insufficient collateral in vault");
        
        // Calculate and deduct mint fee from minted amount
        uint256 fee = (aaplAmount * mintFee) / 10000;
        uint256 netAaplAmount = aaplAmount - fee;
        
        // Withdraw collateral from vault (this contract needs withdrawal permission)
        collateralVault.withdrawCollateral(user, collateralUsed, address(this));
        
        // Mint AAPL-x tokens to user
        aaplToken.mint(user, netAaplAmount);
        
        // Track user's AAPL position
        userAaplBalance[user] += netAaplAmount;
        
        emit Minted(user, collateralUsed, netAaplAmount, aaplPrice, fee);
        
        return collateralUsed;
    }

    /**
     * @dev Redeem AAPL-x tokens to get back USDC collateral  
     * @param user Address of the user
     * @param aaplAmount Amount of AAPL-x tokens to burn (18 decimals)
     * @return collateralReturned Amount of USDC returned (6 decimals)
     * @notice Per SDD Architecture: AA --> Synth --> Vault
     */
    function redeem(address user, uint256 aaplAmount) external onlyRole(AA_ROLE) nonReentrant whenNotPaused returns (uint256 collateralReturned) {
        require(user != address(0), "SyntheticStock: invalid user");
        require(aaplAmount > 0, "SyntheticStock: amount must be positive");
        require(aaplToken.balanceOf(user) >= aaplAmount, "SyntheticStock: insufficient AAPL-x balance");
        require(userAaplBalance[user] >= aaplAmount, "SyntheticStock: insufficient user position");
        
        // Get current AAPL price for event logging
        (int256 price, ) = oracle.getPrice();
        require(price > 0, "SyntheticStock: invalid price");
        uint256 aaplPrice = uint256(price);
        
        // Calculate proportional collateral to return based on current price and collateralization
        // Formula: Collateral = (AAPL amount * price * 150%) / 100
        collateralReturned = (aaplAmount * aaplPrice * COLLATERAL_RATIO) / 
                           (100 * 10**(AAPL_DECIMALS + PRICE_DECIMALS - USDC_DECIMALS));
        
        require(collateralReturned > 0, "SyntheticStock: no collateral to redeem");
        
        // Calculate and deduct redeem fee
        uint256 fee = (collateralReturned * redeemFee) / 10000;
        uint256 netReturn = collateralReturned - fee;
        
        // Burn AAPL-x tokens from user
        aaplToken.burn(user, aaplAmount);
        
        // Update user position
        userAaplBalance[user] -= aaplAmount;
        
        // Deposit collateral back to vault for user
        usdcToken.approve(address(collateralVault), netReturn);
        collateralVault.depositCollateral(user, netReturn);
        
        emit Redeemed(user, aaplAmount, netReturn, aaplPrice, fee);
        
        return netReturn;
    }

    /**
     * @dev Get the current system collateralization ratio
     * @return ratio System-wide collateralization ratio (percentage)
     */
    function getSystemCollateralizationRatio() external view returns (uint256 ratio) {
        uint256 totalSupply = aaplToken.totalSupply();
        if (totalSupply == 0) return type(uint256).max;
        
        (int256 price, , ) = oracle.getPriceUnsafe();
        if (price <= 0) return 0;
        
        uint256 aaplPrice = uint256(price);
        uint256 totalCollateral = collateralVault.getTotalCollateral();
        
        // Calculate total AAPL value in USDC terms
        uint256 totalAaplValueInUsd = (totalSupply * aaplPrice) / 
                                     10**(AAPL_DECIMALS + PRICE_DECIMALS - USDC_DECIMALS);
        
        if (totalAaplValueInUsd == 0) return type(uint256).max;
        
        ratio = (totalCollateral * 100) / totalAaplValueInUsd;
        return ratio;
    }

    /**
     * @dev Get user's collateralization ratio
     * @param user Address of the user
     * @return ratio User's collateralization ratio (percentage)
     */
    function getUserCollateralizationRatio(address user) external view returns (uint256 ratio) {
        uint256 userAapl = userAaplBalance[user];
        if (userAapl == 0) return type(uint256).max;
        
        (int256 price, , ) = oracle.getPriceUnsafe();
        if (price <= 0) return 0;
        
        uint256 aaplPrice = uint256(price);
        uint256 userCollateral = collateralVault.getUserCollateral(user);
        
        // Calculate user's AAPL value in USDC terms
        uint256 userAaplValueInUsd = (userAapl * aaplPrice) / 
                                    10**(AAPL_DECIMALS + PRICE_DECIMALS - USDC_DECIMALS);
        
        if (userAaplValueInUsd == 0) return type(uint256).max;
        
        ratio = (userCollateral * 100) / userAaplValueInUsd;
        return ratio;
    }

    /**
     * @dev Check if system is properly collateralized
     * @return bool True if system has >= 150% collateralization
     */
    function isSystemSolvent() external view returns (bool) {
        uint256 ratio = this.getSystemCollateralizationRatio();
        return ratio >= COLLATERAL_RATIO;
    }

    /**
     * @dev Check if user position can be liquidated
     * @param user Address of the user
     * @return bool True if user is under-collateralized
     */
    function canLiquidate(address user) external view returns (bool) {
        uint256 ratio = this.getUserCollateralizationRatio(user);
        return ratio > 0 && ratio < LIQUIDATION_THRESHOLD;
    }

    /**
     * @dev Add AA wallet address (admin only)
     */
    function addAAWallet(address aaWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(aaWallet != address(0), "SyntheticStock: invalid AA wallet");
        _grantRole(AA_ROLE, aaWallet);
    }

    /**
     * @dev Remove AA wallet address (admin only)
     */
    function removeAAWallet(address aaWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(AA_ROLE, aaWallet);
    }

    /**
     * @dev Emergency pause function per SDD security requirements
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Update fees (only admin) per SDD requirements
     */
    function updateFees(uint256 newMintFee, uint256 newRedeemFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMintFee <= MAX_FEE, "SyntheticStock: mint fee too high");
        require(newRedeemFee <= MAX_FEE, "SyntheticStock: redeem fee too high");
        
        mintFee = newMintFee;
        redeemFee = newRedeemFee;
        
        emit FeesUpdated(newMintFee, newRedeemFee);
    }

    /**
     * @dev Withdraw collected fees (admin only)
     */
    function withdrawFees(address recipient, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "SyntheticStock: invalid recipient");
        uint256 availableFees = usdcToken.balanceOf(address(this));
        require(amount <= availableFees, "SyntheticStock: insufficient fees");
        
        usdcToken.safeTransfer(recipient, amount);
    }

    /**
     * @dev Authorize contract upgrades per UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}

    /**
     * @dev Get contract version per SDD requirements
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 